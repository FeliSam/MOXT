-- Attribuer les fichiers du bucket privé `documents` non référencés,
-- au lieu de les supprimer. Le chemin commence toujours par {userId}/…
-- (RLS storage). Forme business : {userId}/business/{businessId}/…

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
begin
  if auth.uid() is not null and not public.moxt_is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  for r in
    select o.name as object_name, o.created_at, o.metadata
    from storage.objects o
    where o.bucket_id = 'documents'
      and o.created_at < now() - make_interval(hours => greatest(p_grace_hours, 0))
      and not exists (
        select 1 from public.personal_documents d
        where d.storage_path = o.name
           or (d.url is not null and position(o.name in d.url) > 0)
      )
      and not exists (
        select 1 from public.business_documents b
        where b.storage_path = o.name
           or (b.url is not null and position(o.name in b.url) > 0)
      )
    order by o.created_at asc
  loop
    object_name := r.object_name;
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

    if not exists (select 1 from auth.users u where u.id = v_owner)
       and not exists (select 1 from public.profiles p where p.id = v_owner) then
      attributed_as := 'skipped';
      detail := 'propriétaire introuvable';
      return next;
      continue;
    end if;

    v_file_name := v_parts[array_length(v_parts, 1)];
    v_ext := lower(coalesce(substring(v_file_name from '\.([^.]+)$'), ''));
    v_category := lower(coalesce(nullif(split_part(v_file_name, '-', 1), ''), 'other'));
    v_category := regexp_replace(v_category, '[^a-z0-9_]+', '', 'g');
    if v_category = '' then
      v_category := 'other';
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

    -- {userId}/business/{businessId}/{file}
    if array_length(v_parts, 1) >= 4
       and v_parts[2] = 'business'
       and coalesce(v_parts[3], '') <> '' then
      v_business_id := v_parts[3];
      if not exists (
        select 1 from public.businesses b where b.id = v_business_id
      ) then
        attributed_as := 'skipped';
        detail := 'entreprise introuvable';
        return next;
        continue;
      end if;

      v_doc_id := 'BDOC-REATTR-' || replace(gen_random_uuid()::text, '-', '');
      insert into public.business_documents (
        id, business_id, owner_id, category, name, size, type,
        url, storage_path, status, review_note, created_at, updated_at, legal_hold_until
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
        'Réattribué automatiquement depuis le stockage (fichier non référencé).',
        coalesce(r.created_at, now()),
        now(),
        coalesce(r.created_at, now()) + interval '5 years'
      )
      on conflict (id) do nothing;

      attributed_as := 'business';
      detail := v_doc_id;
      return next;
      continue;
    end if;

    -- {userId}/{file} → personal
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
      coalesce(r.created_at, now()),
      coalesce(r.created_at, now()) + interval '5 years',
      null,
      false
    )
    on conflict (id) do nothing;

    attributed_as := 'personal';
    detail := v_doc_id;
    return next;
  end loop;
end;
$$;

comment on function public.moxt_reattribute_orphan_documents(int) is
  'Crée des lignes personal_documents / business_documents pour les objets storage non référencés (attribution par préfixe userId).';

revoke all on function public.moxt_reattribute_orphan_documents(int) from public;
grant execute on function public.moxt_reattribute_orphan_documents(int) to authenticated;

-- Hygiene cron: signaler qu'il faut attribuer (pas purger).
create or replace function public.moxt_report_document_hygiene()
returns int
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_orphans int;
  v_expired int;
  admin_record record;
  v_notified int := 0;
  v_day text := to_char(now(), 'YYYY-MM-DD');
begin
  select count(*) into v_orphans from public.moxt_orphan_document_objects(24);
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
      'Documents à attribuer',
      v_orphans || ' fichier(s) non référencé(s) à rattacher (Admin → Documents → Attribuer), '
        || v_expired || ' document(s) hors rétention légale.',
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

notify pgrst, 'reload schema';
