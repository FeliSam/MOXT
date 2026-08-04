-- Réparation documents : hériter confirmation déjà faite, dédoublonner, cleanup one-shot.
-- Évite la boucle « réparer → nouveaux pending_review → reconfirmation admin ».

-- ── Normalisation catégorie (alignée uploads Verification / business) ──────

create or replace function private.moxt_normalize_document_category(
  p_raw text,
  p_kind text default 'personal'
)
returns text
language plpgsql
immutable
as $$
declare
  v text := lower(coalesce(nullif(trim(p_raw), ''), 'other'));
begin
  v := regexp_replace(v, '[^a-z0-9_:]+', '_', 'g');
  v := replace(v, ':', '_');
  v := regexp_replace(v, '_+', '_', 'g');
  v := trim(both '_' from v);

  if v like 'identity%' or v in ('passport', 'id', 'id_passport', 'id_card') then
    v := 'identity';
  elsif v like 'residence%' or v like 'address%' then
    v := 'address';
  elsif v like 'selfie%' then
    v := 'selfie';
  elsif v like 'income%' then
    v := 'income';
  elsif v like 'registration%' or v = 'company' then
    v := case when p_kind = 'business' then 'registration' else 'other' end;
  elsif v like 'license%' then
    v := 'license';
  elsif v like 'tax%' then
    v := 'tax';
  elsif v like 'bank%' then
    v := 'bank';
  end if;

  if p_kind = 'business' then
    if v not in (
      'registration', 'license', 'tax', 'address', 'bank', 'identity', 'other', 'company'
    ) then
      v := 'other';
    end if;
    if v = 'company' then
      v := 'registration';
    end if;
  else
    if v not in ('identity', 'address', 'income', 'other', 'passport', 'selfie') then
      v := 'other';
    end if;
    if v = 'passport' then
      v := 'identity';
    end if;
  end if;

  return v;
end;
$$;

revoke all on function private.moxt_normalize_document_category(text, text) from public;

-- ── Attribution orphelins avec héritage de confirmation ────────────────────

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
  v_status text;
  v_note text;
  v_inherit boolean;
  v_sibling text;
  v_profile_verified boolean;
  v_business_verified boolean;
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
      if array_length(v_parts, 1) >= 5
         and v_parts[2] = 'business'
         and coalesce(v_parts[4], '') <> '' then
        v_category := private.moxt_normalize_document_category(v_parts[4], 'business');
      elsif array_length(v_parts, 1) >= 3
         and v_parts[2] is distinct from 'business'
         and position('.' in v_parts[2]) = 0 then
        v_category := private.moxt_normalize_document_category(v_parts[2], 'personal');
      else
        v_category := private.moxt_normalize_document_category(
          split_part(v_file_name, '-', 1),
          case when v_parts[2] = 'business' then 'business' else 'personal' end
        );
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

      -- Business path
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

        v_category := private.moxt_normalize_document_category(v_category, 'business');

        select b.id into v_sibling
        from public.business_documents b
        where b.business_id = v_business_id
          and b.category = v_category
          and b.status = 'verified'
          and b.superseded_at is null
        order by b.created_at desc nulls last
        limit 1;

        select exists (
          select 1 from public.businesses biz
          where biz.id = v_business_id
            and biz.status in ('verified', 'approved', 'active')
        ) into v_business_verified;

        v_inherit := (v_sibling is not null) or coalesce(v_business_verified, false);
        v_status := case when v_inherit then 'verified' else 'pending_review' end;
        v_note := case
          when v_inherit then 'Réattribué (confirmation héritée).'
          else 'Réattribué automatiquement depuis le stockage.'
        end;

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
          v_status,
          v_note,
          coalesce(r.uploaded_at, now()),
          now(),
          coalesce(r.uploaded_at, now()) + interval '5 years',
          null
        )
        on conflict (id) do nothing;

        attributed_as := 'business';
        detail := v_doc_id || ' → ' || v_business_id || ' (' || v_status || ')';
        return next;
        continue;
      end if;

      -- Personal path
      v_category := private.moxt_normalize_document_category(v_category, 'personal');

      select d.id into v_sibling
      from public.personal_documents d
      where d.user_id = v_owner
        and private.moxt_normalize_document_category(d.category, 'personal') = v_category
        and d.status = 'verified'
        and d.deleted_at is null
        and coalesce(d.deleted_by_user, false) = false
      order by d.created_at desc nulls last
      limit 1;

      select exists (
        select 1 from public.profiles p
        where p.id = v_owner and p.status = 'verified'
      ) into v_profile_verified;

      -- Also inherit if a verified KYC request references any doc of this user
      if not coalesce(v_profile_verified, false) then
        select exists (
          select 1 from public.verification_requests vr
          where vr.user_id = v_owner and vr.status = 'verified'
        ) into v_profile_verified;
      end if;

      v_inherit := (v_sibling is not null) or coalesce(v_profile_verified, false);
      v_status := case when v_inherit then 'verified' else 'pending_review' end;

      v_doc_id := 'PDOC-REATTR-' || replace(gen_random_uuid()::text, '-', '');
      insert into public.personal_documents (
        id, user_id, category, name, size, type,
        url, storage_path, status, created_at, legal_hold_until,
        deleted_at, deleted_by_user
      ) values (
        v_doc_id,
        v_owner,
        v_category,
        v_file_name,
        v_size,
        v_mime,
        null,
        r.object_name,
        v_status,
        coalesce(r.uploaded_at, now()),
        coalesce(r.uploaded_at, now()) + interval '5 years',
        null,
        false
      )
      on conflict (id) do nothing;

      attributed_as := 'personal';
      detail := v_doc_id || ' (' || v_status || ')';
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
  'Rattache les objets storage orphelins au propriétaire ; hérite verified si confirmation déjà faite.';

revoke all on function public.moxt_reattribute_orphan_documents(int) from public;
grant execute on function public.moxt_reattribute_orphan_documents(int) to authenticated;

-- ── Dédoublonnage renforcé ─────────────────────────────────────────────────

create or replace function public.moxt_dedupe_documents()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path_biz int := 0;
  v_path_personal int := 0;
  v_biz int := 0;
  v_personal int := 0;
  v_other_biz int := 0;
  v_other_personal int := 0;
begin
  if auth.uid() is not null and not public.moxt_is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  -- Doublons de storage_path (business)
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

  -- Doublons de storage_path (personal)
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

  -- Business : même entreprise + catégorie (hors other)
  with ranked as (
    select id,
      row_number() over (
        partition by business_id, private.moxt_normalize_document_category(category, 'business')
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
      and status is distinct from 'superseded'
      and private.moxt_normalize_document_category(category, 'business') is distinct from 'other'
  )
  update public.business_documents b
  set
    superseded_at = now(),
    status = 'superseded',
    updated_at = now(),
    review_note = coalesce(nullif(b.review_note, ''), 'Doublon consolidé automatiquement.')
  from ranked r
  where b.id = r.id and r.rn > 1;
  get diagnostics v_biz = row_count;

  -- Business other : même entreprise + nom normalisé
  with ranked as (
    select id,
      row_number() over (
        partition by business_id, lower(regexp_replace(coalesce(name, ''), '[^a-z0-9]+', '', 'g'))
        order by
          case when status = 'verified' then 0 else 1 end,
          created_at desc nulls last,
          id
      ) as rn
    from public.business_documents
    where superseded_at is null
      and status is distinct from 'superseded'
      and private.moxt_normalize_document_category(category, 'business') = 'other'
      and coalesce(name, '') <> ''
  )
  update public.business_documents b
  set
    superseded_at = now(),
    status = 'superseded',
    updated_at = now(),
    review_note = coalesce(nullif(b.review_note, ''), 'Doublon other consolidé.')
  from ranked r
  where b.id = r.id and r.rn > 1;
  get diagnostics v_other_biz = row_count;

  -- Personal : même user + catégorie (hors other)
  with ranked as (
    select id,
      row_number() over (
        partition by user_id, private.moxt_normalize_document_category(category, 'personal')
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
      and private.moxt_normalize_document_category(category, 'personal') is distinct from 'other'
  )
  update public.personal_documents d
  set
    deleted_at = now(),
    deleted_by_user = false
  from ranked r
  where d.id = r.id and r.rn > 1;
  get diagnostics v_personal = row_count;

  -- Personal other : même user + nom normalisé
  with ranked as (
    select id,
      row_number() over (
        partition by user_id, lower(regexp_replace(coalesce(name, ''), '[^a-z0-9]+', '', 'g'))
        order by
          case when status = 'verified' then 0 else 1 end,
          created_at desc nulls last,
          id
      ) as rn
    from public.personal_documents
    where deleted_at is null
      and coalesce(deleted_by_user, false) = false
      and private.moxt_normalize_document_category(category, 'personal') = 'other'
      and coalesce(name, '') <> ''
  )
  update public.personal_documents d
  set
    deleted_at = now(),
    deleted_by_user = false
  from ranked r
  where d.id = r.id and r.rn > 1;
  get diagnostics v_other_personal = row_count;

  -- Pending fantômes business déjà couverts par un verified sibling
  update public.business_documents b
  set
    superseded_at = coalesce(b.superseded_at, now()),
    status = 'superseded',
    updated_at = now(),
    review_note = coalesce(nullif(b.review_note, ''), 'Doublon : confirmation déjà présente.')
  where b.status in ('pending_review', 'pending')
    and b.superseded_at is null
    and exists (
      select 1 from public.business_documents v
      where v.business_id = b.business_id
        and private.moxt_normalize_document_category(v.category, 'business')
          = private.moxt_normalize_document_category(b.category, 'business')
        and v.status = 'verified'
        and v.superseded_at is null
        and v.id is distinct from b.id
    );

  -- Pending fantômes perso déjà couverts par un verified sibling
  update public.personal_documents d
  set
    deleted_at = coalesce(d.deleted_at, now()),
    deleted_by_user = false
  where d.status in ('pending_review', 'pending')
    and d.deleted_at is null
    and exists (
      select 1 from public.personal_documents v
      where v.user_id = d.user_id
        and private.moxt_normalize_document_category(v.category, 'personal')
          = private.moxt_normalize_document_category(d.category, 'personal')
        and v.status = 'verified'
        and v.deleted_at is null
        and coalesce(v.deleted_by_user, false) = false
        and v.id is distinct from d.id
    );

  return jsonb_build_object(
    'business_superseded', v_biz,
    'personal_soft_deleted', v_personal,
    'business_other_superseded', v_other_biz,
    'personal_other_soft_deleted', v_other_personal,
    'business_path_duplicates_removed', v_path_biz,
    'personal_path_duplicates_removed', v_path_personal
  );
end;
$$;

comment on function public.moxt_dedupe_documents() is
  'Consolide doublons path/catégorie ; marque superseded ; soft-delete perso ; hérite verified.';

revoke all on function public.moxt_dedupe_documents() from public;
grant execute on function public.moxt_dedupe_documents() to authenticated;

-- ── One-shot cleanup : propager KYC déjà validé vers personal_documents ─────

-- Docs explicitement listés dans une demande KYC verified
update public.personal_documents d
set status = 'verified'
where d.status in ('pending_review', 'pending')
  and d.deleted_at is null
  and exists (
    select 1
    from public.verification_requests vr
    where vr.user_id = d.user_id
      and vr.status = 'verified'
      and (
        vr.document_ids @> to_jsonb(ARRAY[d.id]::text[])
        or vr.document_ids @> jsonb_build_array(d.id)
      )
  );

-- Profil déjà verified → docs identity/address encore pending → verified
update public.personal_documents d
set status = 'verified'
where d.status in ('pending_review', 'pending')
  and d.deleted_at is null
  and private.moxt_normalize_document_category(d.category, 'personal') in ('identity', 'address', 'selfie')
  and exists (
    select 1 from public.profiles p
    where p.id = d.user_id
      and p.status = 'verified'
  );

-- Business docs pending alors que l'entreprise est déjà live → verified
update public.business_documents b
set
  status = 'verified',
  updated_at = now(),
  review_note = coalesce(nullif(b.review_note, ''), 'Confirmé : entreprise déjà validée.')
where b.status in ('pending_review', 'pending')
  and b.superseded_at is null
  and exists (
    select 1 from public.businesses biz
    where biz.id = b.business_id
      and biz.status in ('verified', 'approved', 'active')
  );

-- Soft-delete / supersede REATTR redondants si sibling verified existe
update public.personal_documents d
set
  deleted_at = coalesce(d.deleted_at, now()),
  deleted_by_user = false
where d.id like 'PDOC-REATTR-%'
  and d.status in ('pending_review', 'pending')
  and d.deleted_at is null
  and exists (
    select 1 from public.personal_documents v
    where v.user_id = d.user_id
      and private.moxt_normalize_document_category(v.category, 'personal')
        = private.moxt_normalize_document_category(d.category, 'personal')
      and v.status = 'verified'
      and v.deleted_at is null
      and v.id is distinct from d.id
  );

update public.business_documents b
set
  superseded_at = coalesce(b.superseded_at, now()),
  status = 'superseded',
  updated_at = now()
where b.id like 'BDOC-REATTR-%'
  and b.status in ('pending_review', 'pending')
  and b.superseded_at is null
  and exists (
    select 1 from public.business_documents v
    where v.business_id = b.business_id
      and private.moxt_normalize_document_category(v.category, 'business')
        = private.moxt_normalize_document_category(b.category, 'business')
      and v.status = 'verified'
      and v.superseded_at is null
      and v.id is distinct from b.id
  );

-- Passer un dédoublonnage final
select public.moxt_dedupe_documents();
