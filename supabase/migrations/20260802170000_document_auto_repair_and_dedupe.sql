-- Réparation documents : attribution auto, dossiers entreprise, dédoublonnage.
-- Corrige la boucle « analyse → mêmes orphelins » (échecs silencieux, business_id
-- sanitisé, placeholders) et empêche les doublons de fiches.

-- Le garde-fou review accédait à NEW.review_status alors que la colonne n’existe
-- pas → toute INSERT business_documents plantait (ex. réparation auto).
create or replace function private.moxt_business_documents_review_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new jsonb := to_jsonb(new);
begin
  if not public.moxt_is_admin() then
    if tg_op = 'INSERT' then
      if v_new ? 'reviewed_at' then new.reviewed_at := null; end if;
      if v_new ? 'reviewed_by' then new.reviewed_by := null; end if;
      if v_new ? 'review_note' then new.review_note := null; end if;
    elsif tg_op = 'UPDATE' then
      if v_new ? 'reviewed_at' then new.reviewed_at := old.reviewed_at; end if;
      if v_new ? 'reviewed_by' then new.reviewed_by := old.reviewed_by; end if;
      if v_new ? 'review_note' then new.review_note := old.review_note; end if;
    end if;
  end if;
  return new;
end;
$$;

alter table public.business_documents
  add column if not exists superseded_at timestamptz;

comment on column public.business_documents.superseded_at is
  'Non null = doublon / version remplacée (fichier storage conservé pour rétention).';

-- Nettoyer les doublons de chemin AVANT l’index unique (sinon CREATE INDEX échoue).
with ranked as (
  select id,
    row_number() over (
      partition by storage_path
      order by
        case when status = 'verified' then 0 else 1 end,
        created_at desc nulls last,
        id
    ) as rn
  from public.business_documents
  where storage_path is not null and storage_path <> ''
)
delete from public.business_documents b
using ranked r
where b.id = r.id and r.rn > 1;

with ranked as (
  select id,
    row_number() over (
      partition by storage_path
      order by
        case when status = 'verified' then 0 else 1 end,
        created_at desc nulls last,
        id
    ) as rn
  from public.personal_documents
  where storage_path is not null and storage_path <> ''
)
delete from public.personal_documents d
using ranked r
where d.id = r.id and r.rn > 1;

create unique index if not exists personal_documents_storage_path_uidx
  on public.personal_documents (storage_path)
  where storage_path is not null and storage_path <> '';

create unique index if not exists business_documents_storage_path_uidx
  on public.business_documents (storage_path)
  where storage_path is not null and storage_path <> '';

-- ── Helpers ────────────────────────────────────────────────────────────────

create or replace function private.moxt_sanitize_storage_segment(p text)
returns text
language sql
immutable
as $$
  select coalesce(nullif(regexp_replace(coalesce(p, ''), '[^a-zA-Z0-9_-]', '_', 'g'), ''), '');
$$;

create or replace function private.moxt_resolve_business_id(p_owner uuid, p_segment text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_id text;
  v_safe text := private.moxt_sanitize_storage_segment(p_segment);
begin
  if coalesce(p_segment, '') = '' then
    return null;
  end if;

  select b.id into v_id from public.businesses b where b.id = p_segment limit 1;
  if v_id is not null then
    return v_id;
  end if;

  if v_safe <> '' then
    select b.id into v_id
    from public.businesses b
    where private.moxt_sanitize_storage_segment(b.id) = v_safe
    limit 1;
    if v_id is not null then
      return v_id;
    end if;
  end if;

  -- Un seul commerce pour ce propriétaire → rattacher plutôt que laisser orphelin
  if p_owner is not null then
    select b.id into v_id
    from public.businesses b
    where b.owner_id = p_owner
    order by b.created_at asc nulls last, b.id
    limit 1;
    if (
      select count(*) from public.businesses b2 where b2.owner_id = p_owner
    ) = 1 then
      return v_id;
    end if;
  end if;

  return null;
end;
$$;

revoke all on function private.moxt_sanitize_storage_segment(text) from public;
revoke all on function private.moxt_resolve_business_id(uuid, text) from public;

-- ── Orphans : ignorer placeholders ; soft-delete perso compte toujours ─────

create or replace function public.moxt_orphan_document_objects(p_grace_hours int default 24)
returns table (object_name text, uploaded_at timestamptz)
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  if auth.uid() is not null and not public.moxt_is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;
  return query
    select o.name, o.created_at
    from storage.objects o
    where o.bucket_id = 'documents'
      and o.created_at < now() - make_interval(hours => greatest(p_grace_hours, 0))
      and o.name !~* '(^|/)\.emptyfolderplaceholder$'
      and o.name !~ '/$'
      and not exists (
        select 1 from public.personal_documents d
        where d.storage_path = o.name
           or (d.url is not null and position(o.name in d.url) > 0)
      )
      and not exists (
        select 1 from public.business_documents b
        where b.storage_path = o.name
           or (b.url is not null and position(o.name in b.url) > 0)
      );
end;
$$;

revoke all on function public.moxt_orphan_document_objects(int) from public;
grant execute on function public.moxt_orphan_document_objects(int) to authenticated;

-- ── Attribution robuste (une erreur ne bloque plus le lot) ─────────────────

create or replace function public.moxt_reattribute_orphan_documents(
  p_grace_hours int default 0
)
returns table (
  object_name text,
  attributed_as text,
  detail text
)
language plpgsql
security definer
set search_path = public, storage, auth
as $$
declare
  r record;
  v_owner uuid;
  v_business_id text;
  v_file_name text;
  v_category text;
  v_ext text;
  v_mime text;
  v_size int;
  v_doc_id text;
  v_parts text[];
  v_existing text;
begin
  if auth.uid() is not null and not public.moxt_is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  for r in
    select o.object_name, o.uploaded_at, so.metadata
    from public.moxt_orphan_document_objects(p_grace_hours) o
    left join storage.objects so
      on so.bucket_id = 'documents' and so.name = o.object_name
    order by o.uploaded_at asc nulls last
  loop
    object_name := r.object_name;
    begin
      v_parts := string_to_array(r.object_name, '/');

      if coalesce(array_length(v_parts, 1), 0) < 2 then
        attributed_as := 'skipped';
        detail := 'chemin trop court';
        return next;
        continue;
      end if;

      begin
        v_owner := v_parts[1]::uuid;
      exception
        when others then
          attributed_as := 'skipped';
          detail := 'préfixe non-UUID';
          return next;
          continue;
      end;

      if not exists (select 1 from auth.users u where u.id = v_owner) then
        attributed_as := 'skipped';
        detail := 'propriétaire introuvable';
        return next;
        continue;
      end if;

      v_file_name := v_parts[array_length(v_parts, 1)];
      if v_file_name is null or v_file_name = '' or lower(v_file_name) = '.emptyfolderplaceholder' then
        attributed_as := 'skipped';
        detail := 'placeholder';
        return next;
        continue;
      end if;

      v_ext := lower(coalesce(substring(v_file_name from '\.([^.]+)$'), ''));
      -- Formats :
      --   {user}/business/{biz}/{category}/{file}
      --   {user}/business/{biz}/{category}-{ts}.ext  (legacy)
      --   {user}/{category}/{file}
      --   {user}/{category}-{ts}.ext                 (legacy)
      if array_length(v_parts, 1) >= 5
         and v_parts[2] = 'business'
         and coalesce(v_parts[4], '') <> '' then
        v_category := lower(private.moxt_sanitize_storage_segment(v_parts[4]));
      elsif array_length(v_parts, 1) >= 3
         and v_parts[2] is distinct from 'business'
         and position('.' in v_parts[2]) = 0 then
        v_category := lower(private.moxt_sanitize_storage_segment(v_parts[2]));
      else
        v_category := lower(coalesce(nullif(split_part(v_file_name, '-', 1), ''), 'other'));
        v_category := regexp_replace(v_category, '[^a-z0-9_]+', '', 'g');
      end if;
      if v_category = '' then
        v_category := 'other';
      end if;
      -- KYC identitypassport / residencexxx → buckets perso connus
      if v_category like 'identity%' then
        v_category := 'identity';
      elsif v_category like 'residence%' then
        v_category := 'address';
      elsif v_category like 'selfie%' then
        v_category := 'selfie';
      end if;

      v_mime := coalesce(
        nullif(r.metadata->>'mimetype', ''),
        case v_ext
          when 'pdf' then 'application/pdf'
          when 'png' then 'image/png'
          when 'jpg' then 'image/jpeg'
          when 'jpeg' then 'image/jpeg'
          when 'webp' then 'image/webp'
          else 'application/octet-stream'
        end
      );
      begin
        v_size := greatest(0, coalesce((r.metadata->>'size')::int, 0));
      exception
        when others then
          v_size := 0;
      end;

      -- Déjà référencé (course) → ignorer
      select d.id into v_existing
      from public.personal_documents d
      where d.storage_path = r.object_name
      limit 1;
      if v_existing is not null then
        attributed_as := 'exists';
        detail := v_existing;
        return next;
        continue;
      end if;
      select b.id into v_existing
      from public.business_documents b
      where b.storage_path = r.object_name
      limit 1;
      if v_existing is not null then
        attributed_as := 'exists';
        detail := v_existing;
        return next;
        continue;
      end if;

      -- {userId}/business/{businessId}/[category/]file
      if array_length(v_parts, 1) >= 4
         and v_parts[2] = 'business'
         and coalesce(v_parts[3], '') <> '' then
        v_business_id := private.moxt_resolve_business_id(v_owner, v_parts[3]);
        if v_business_id is null then
          attributed_as := 'skipped';
          detail := 'entreprise introuvable';
          return next;
          continue;
        end if;

        if v_category not in (
          'registration', 'license', 'tax', 'address', 'bank', 'identity', 'other', 'company'
        ) then
          v_category := 'other';
        end if;

        v_doc_id := 'BDOC-REATTR-' || replace(gen_random_uuid()::text, '-', '');
        insert into public.business_documents (
          id, business_id, owner_id, category, name, size, type,
          url, storage_path, status, review_note, created_at, updated_at, legal_hold_until,
          superseded_at
        ) values (
          v_doc_id,
          v_business_id,
          v_owner,
          v_category,
          v_file_name,
          v_size,
          v_mime,
          null,
          r.object_name,
          'pending_review',
          'Réattribué automatiquement depuis le stockage.',
          coalesce(r.uploaded_at, now()),
          now(),
          coalesce(r.uploaded_at, now()) + interval '5 years',
          null
        )
        on conflict (id) do nothing;

        attributed_as := 'business';
        detail := v_doc_id || ' → ' || v_business_id;
        return next;
        continue;
      end if;

      -- {userId}/… → personal
      v_doc_id := 'PDOC-REATTR-' || replace(gen_random_uuid()::text, '-', '');
      insert into public.personal_documents (
        id, user_id, category, name, size, type,
        url, storage_path, status, created_at, legal_hold_until,
        deleted_at, deleted_by_user
      ) values (
        v_doc_id,
        v_owner,
        case
          when v_category in ('identity', 'address', 'income', 'other', 'passport', 'selfie')
            then v_category
          else 'other'
        end,
        v_file_name,
        v_size,
        v_mime,
        null,
        r.object_name,
        'pending_review',
        coalesce(r.uploaded_at, now()),
        coalesce(r.uploaded_at, now()) + interval '5 years',
        null,
        false
      )
      on conflict (id) do nothing;

      attributed_as := 'personal';
      detail := v_doc_id;
      return next;
    exception
      when unique_violation then
        attributed_as := 'exists';
        detail := 'storage_path déjà lié';
        return next;
      when others then
        attributed_as := 'skipped';
        detail := left('erreur: ' || sqlerrm, 200);
        return next;
    end;
  end loop;
end;
$$;

comment on function public.moxt_reattribute_orphan_documents(int) is
  'Crée personal/business_documents pour objets storage non référencés (par préfixe userId / business).';

revoke all on function public.moxt_reattribute_orphan_documents(int) from public;
grant execute on function public.moxt_reattribute_orphan_documents(int) to authenticated;

-- ── Dédoublonnage ──────────────────────────────────────────────────────────

create or replace function public.moxt_dedupe_documents()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_biz int := 0;
  v_personal int := 0;
  v_path_biz int := 0;
  v_path_personal int := 0;
begin
  if auth.uid() is not null and not public.moxt_is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  -- Doublons stricts même storage_path (au cas où l’index unique n’était pas là)
  with ranked as (
    select id,
      row_number() over (
        partition by storage_path
        order by
          case when status = 'verified' then 0 else 1 end,
          created_at desc nulls last,
          id
      ) as rn
    from public.business_documents
    where storage_path is not null and storage_path <> ''
  )
  delete from public.business_documents b
  using ranked r
  where b.id = r.id and r.rn > 1;
  get diagnostics v_path_biz = row_count;

  with ranked as (
    select id,
      row_number() over (
        partition by storage_path
        order by
          case when status = 'verified' then 0 else 1 end,
          created_at desc nulls last,
          id
      ) as rn
    from public.personal_documents
    where storage_path is not null and storage_path <> ''
  )
  delete from public.personal_documents d
  using ranked r
  where d.id = r.id and r.rn > 1;
  get diagnostics v_path_personal = row_count;

  -- Plusieurs fiches actives même entreprise + catégorie (sauf other)
  with ranked as (
    select id,
      row_number() over (
        partition by business_id, category
        order by
          case
            when status = 'verified' then 0
            when status in ('pending_review', 'pending') then 1
            when status = 'rejected' then 2
            else 3
          end,
          created_at desc nulls last,
          id
      ) as rn
    from public.business_documents
    where superseded_at is null
      and category is distinct from 'other'
  )
  update public.business_documents b
  set
    superseded_at = now(),
    updated_at = now(),
    review_note = coalesce(nullif(b.review_note, ''), 'Doublon consolidé automatiquement.')
  from ranked r
  where b.id = r.id and r.rn > 1;
  get diagnostics v_biz = row_count;

  -- Perso : soft-delete des doublons de catégorie (sauf other)
  with ranked as (
    select id,
      row_number() over (
        partition by user_id, category
        order by
          case
            when status = 'verified' then 0
            when status in ('pending_review', 'pending') then 1
            else 2
          end,
          created_at desc nulls last,
          id
      ) as rn
    from public.personal_documents
    where deleted_at is null
      and coalesce(deleted_by_user, false) = false
      and category is distinct from 'other'
  )
  update public.personal_documents d
  set
    deleted_at = now(),
    deleted_by_user = false
  from ranked r
  where d.id = r.id and r.rn > 1;
  get diagnostics v_personal = row_count;

  return jsonb_build_object(
    'business_superseded', v_biz,
    'personal_soft_deleted', v_personal,
    'business_path_duplicates_removed', v_path_biz,
    'personal_path_duplicates_removed', v_path_personal
  );
end;
$$;

revoke all on function public.moxt_dedupe_documents() from public;
grant execute on function public.moxt_dedupe_documents() to authenticated;

-- ── Repair = attribuer + dédupliquer (appel admin / cron) ──────────────────

create or replace function public.moxt_repair_documents(p_grace_hours int default 0)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_attributed int := 0;
  v_business int := 0;
  v_personal int := 0;
  v_skipped int := 0;
  v_exists int := 0;
  v_dedupe jsonb;
  v_remaining int;
begin
  if auth.uid() is not null and not public.moxt_is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  for v_row in
    select * from public.moxt_reattribute_orphan_documents(p_grace_hours)
  loop
    if v_row.attributed_as in ('business', 'personal') then
      v_attributed := v_attributed + 1;
      if v_row.attributed_as = 'business' then
        v_business := v_business + 1;
      else
        v_personal := v_personal + 1;
      end if;
    elsif v_row.attributed_as = 'exists' then
      v_exists := v_exists + 1;
    else
      v_skipped := v_skipped + 1;
    end if;
  end loop;

  v_dedupe := public.moxt_dedupe_documents();
  select count(*) into v_remaining from public.moxt_orphan_document_objects(p_grace_hours);

  return jsonb_build_object(
    'attributed', v_attributed,
    'business', v_business,
    'personal', v_personal,
    'skipped', v_skipped,
    'exists', v_exists,
    'remaining', v_remaining,
    'dedupe', v_dedupe
  );
end;
$$;

revoke all on function public.moxt_repair_documents(int) from public;
grant execute on function public.moxt_repair_documents(int) to authenticated;

-- Hygiene : répare automatiquement, n’alerte que s’il reste des non-attribuables

create or replace function public.moxt_report_document_hygiene()
returns int
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_repair jsonb;
  v_orphans int;
  v_expired int;
  admin_record record;
  v_notified int := 0;
  v_day text := to_char(now(), 'YYYY-MM-DD');
begin
  v_repair := public.moxt_repair_documents(24);
  v_orphans := coalesce((v_repair->>'remaining')::int, 0);
  select count(*) into v_expired from public.moxt_purgeable_documents();

  if v_orphans = 0 and v_expired = 0 then
    return 0;
  end if;

  for admin_record in
    select id from public.profiles where role in ('admin', 'superadmin')
  loop
    insert into public.notifications (
      id, user_id, title, message, type, link, priority,
      read, archived, created_at, updated_at
    ) values (
      'NOT-DOCHYG-' || v_day || '-' || left(replace(admin_record.id::text, '-', ''), 12),
      admin_record.id,
      'Documents : reste non attribuable',
      v_orphans || ' fichier(s) sans propriétaire/entreprise valide après réparation auto, '
        || v_expired || ' hors rétention. Admin → Documents → Purger le reste si besoin.',
      'moderation',
      '/admin?view=documents',
      'high',
      false, false, now(), now()
    )
    on conflict (id) do update set
      message = excluded.message,
      read = false,
      archived = false,
      updated_at = now();
    v_notified := v_notified + 1;
  end loop;

  return v_notified;
end;
$$;

revoke all on function public.moxt_report_document_hygiene() from public;

-- Cron quotidien (réparation auto) en plus du hebdo
do $$
begin
  perform cron.unschedule('moxt-document-hygiene-daily');
exception
  when others then null;
end $$;

select cron.schedule(
  'moxt-document-hygiene-daily',
  '15 4 * * *',
  $$select public.moxt_report_document_hygiene();$$
);

-- Réparation initiale : best-effort (ne doit pas faire échouer la migration).
do $$
begin
  perform public.moxt_repair_documents(0);
exception
  when others then
    raise notice 'moxt_repair_documents initial: %', sqlerrm;
end $$;

notify pgrst, 'reload schema';
