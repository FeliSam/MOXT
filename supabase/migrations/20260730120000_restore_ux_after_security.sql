-- Restore core UX broken by security hardening (Wave 1–3).
-- Keep privilege locks (no self-verify business / no self-promote admin),
-- but stop failing legitimate uploads, notifications, and owner workflows.

-- =============================================================================
-- #1 Soften notifications: normalize links, fail-open rate limit
-- =============================================================================

create or replace function public.moxt_create_notification(
  p_id text,
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text default 'system',
  p_link text default null,
  p_priority text default 'normal'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_type text := coalesce(nullif(trim(p_type), ''), 'system');
  v_priority text := case
    when p_priority in ('high', 'normal', 'low') then p_priority
    else 'normal'
  end;
  v_link text := nullif(trim(p_link), '');
  v_recent int;
begin
  if v_actor is null then
    raise exception 'not authenticated';
  end if;

  if p_user_id is null then
    raise exception 'user_id required';
  end if;

  if coalesce(nullif(trim(p_id), ''), '') = '' then
    raise exception 'id required';
  end if;

  if coalesce(nullif(trim(p_title), ''), '') = '' then
    raise exception 'title required';
  end if;

  -- Liens : chemins relatifs ; URLs absolues → path ; sinon drop le lien (ne pas planter).
  if v_link is not null then
    if v_link ~* '^https?://[^/]+(/.*)$' then
      v_link := substring(v_link from '^https?://[^/]+(/.*)$');
    end if;
    if left(v_link, 1) <> '/' or left(v_link, 2) = '//' or v_link ~* '^(javascript:|data:)' then
      v_link := null;
    end if;
  end if;

  -- Types système + high : admin seulement (anti spoof « compte suspendu »)
  if v_type = 'system' and v_priority = 'high' and not public.moxt_is_admin() then
    v_type := 'moderation';
    v_priority := 'normal';
  end if;

  -- Rate limit : 300 / heure — au-delà, no-op (pas d'exception → sync UI non bloquée)
  if not public.moxt_is_admin() then
    select count(*)::int into v_recent
    from public.moxt_notification_rate_log
    where actor_id = v_actor
      and created_at > now() - interval '1 hour';

    if v_recent >= 300 then
      return;
    end if;

    insert into public.moxt_notification_rate_log (actor_id) values (v_actor);
  end if;

  insert into public.notifications (
    id, user_id, title, message, type, link, priority,
    read, archived, created_at
  )
  values (
    p_id,
    p_user_id,
    left(trim(p_title), 200),
    left(coalesce(p_message, ''), 500),
    v_type,
    v_link,
    v_priority,
    false,
    false,
    now()
  )
  on conflict (id) do nothing;
end;
$$;

revoke all on function public.moxt_create_notification(text, uuid, text, text, text, text, text) from public;
grant execute on function public.moxt_create_notification(text, uuid, text, text, text, text, text) to authenticated;

create or replace function public.moxt_notify_admins(
  p_title text,
  p_message text,
  p_type text default 'moderation',
  p_link text default '/admin',
  p_priority text default 'high',
  p_dedupe_key text default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_record record;
  v_actor uuid := auth.uid();
  v_key text := coalesce(nullif(p_dedupe_key, ''), replace(gen_random_uuid()::text, '-', ''));
  v_count int := 0;
  v_link text := coalesce(nullif(trim(p_link), ''), '/admin');
  v_recent int;
begin
  if v_actor is null then
    raise exception 'Authentification requise.';
  end if;

  if v_link ~* '^https?://[^/]+(/.*)$' then
    v_link := substring(v_link from '^https?://[^/]+(/.*)$');
  end if;
  if left(v_link, 1) <> '/' or left(v_link, 2) = '//' or v_link ~* '^(javascript:|data:)' then
    v_link := '/admin';
  end if;

  -- Rate limit non-admin : 60 / heure — au-delà return 0 (pas d'exception)
  if not public.moxt_is_admin() then
    select count(*)::int into v_recent
    from public.moxt_notification_rate_log
    where actor_id = v_actor
      and created_at > now() - interval '1 hour';

    if v_recent >= 60 then
      return 0;
    end if;

    insert into public.moxt_notification_rate_log (actor_id) values (v_actor);
  end if;

  for admin_record in
    select id from public.profiles
    where role in ('admin', 'superadmin')
      and id is distinct from v_actor
  loop
    insert into public.notifications (
      id, user_id, title, message, type, link, priority,
      read, archived, created_at, updated_at
    ) values (
      'NOT-ADM-' || left(v_key, 20) || '-' || left(replace(admin_record.id::text, '-', ''), 12),
      admin_record.id,
      left(trim(p_title), 200),
      left(coalesce(p_message, ''), 500),
      coalesce(nullif(trim(p_type), ''), 'moderation'),
      v_link,
      case when p_priority in ('high', 'normal', 'low') then p_priority else 'high' end,
      false, false, now(), now()
    )
    on conflict (id) do update set
      title = excluded.title,
      message = excluded.message,
      link = excluded.link,
      priority = excluded.priority,
      read = false,
      archived = false,
      updated_at = now();
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- =============================================================================
-- #2 Businesses: owner may resubmit pending statuses (still cannot self-verify)
-- =============================================================================

create or replace function private.moxt_businesses_privilege_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_ok boolean;
  v_allowed_owner_status text[] := array[
    'pending', 'pending_review', 'submitted', 'draft', 'rejected', 'needs_changes'
  ];
begin
  if tg_op = 'INSERT' then
    if not public.moxt_is_admin() then
      if new.status in ('verified', 'approved', 'active') then
        new.status := 'pending_review';
      end if;
      new.pinned_at := null;
      if to_jsonb(new) ? 'pinned_by' then
        new.pinned_by := null;
      end if;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and not public.moxt_is_admin() and not public.moxt_is_moderator() then
    v_owner_ok := (old.owner_id::text = (select auth.uid())::text);

    if new.status is distinct from old.status then
      if v_owner_ok
         and new.status = any (v_allowed_owner_status)
         and old.status = any (v_allowed_owner_status) then
        -- owner may move between non-live statuses (ex. resubmit after reject)
        null;
      else
        new.status := old.status;
      end if;
    end if;

    if new.pinned_at is distinct from old.pinned_at then
      new.pinned_at := old.pinned_at;
    end if;
    if to_jsonb(new) ? 'pinned_by' and new.pinned_by is distinct from old.pinned_by then
      new.pinned_by := old.pinned_by;
    end if;
  end if;

  return new;
end;
$$;

-- Ensure insert/update/select policies still allow owners (pending businesses)
drop policy if exists "MOXT users can create own business" on public.businesses;
create policy "MOXT users can create own business"
on public.businesses
for insert
to authenticated
with check (owner_id::text = (select auth.uid())::text);

drop policy if exists "MOXT users can update own business" on public.businesses;
create policy "MOXT users can update own business"
on public.businesses
for update
to authenticated
using (
  owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
)
with check (
  owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT users can view validated businesses" on public.businesses;
create policy "MOXT users can view validated businesses"
on public.businesses
for select
to authenticated
using (
  status in ('verified', 'approved', 'active')
  or owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

-- =============================================================================
-- #3 Storage: businesses logos/banners + documents (owner folder)
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('businesses', 'businesses', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "MOXT public business images" on storage.objects;
create policy "MOXT public business images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'businesses');

drop policy if exists "MOXT users can upload own business images" on storage.objects;
create policy "MOXT users can upload own business images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'businesses'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or name like ((select auth.uid())::text || '/%')
  )
);

drop policy if exists "MOXT users can update own business images" on storage.objects;
create policy "MOXT users can update own business images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'businesses'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or name like ((select auth.uid())::text || '/%')
  )
)
with check (
  bucket_id = 'businesses'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or name like ((select auth.uid())::text || '/%')
  )
);

drop policy if exists "MOXT users can delete own business images" on storage.objects;
create policy "MOXT users can delete own business images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'businesses'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or name like ((select auth.uid())::text || '/%')
  )
);

-- Documents privés (KYC + business docs côté client)
drop policy if exists "MOXT users read own documents storage" on storage.objects;
create policy "MOXT users read own documents storage"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or name like ((select auth.uid())::text || '/%')
  )
);

drop policy if exists "MOXT users upload own documents storage" on storage.objects;
create policy "MOXT users upload own documents storage"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or name like ((select auth.uid())::text || '/%')
  )
);

drop policy if exists "MOXT users update own documents storage" on storage.objects;
create policy "MOXT users update own documents storage"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or name like ((select auth.uid())::text || '/%')
  )
)
with check (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or name like ((select auth.uid())::text || '/%')
  )
);

drop policy if exists "MOXT users delete own documents storage" on storage.objects;
create policy "MOXT users delete own documents storage"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or name like ((select auth.uid())::text || '/%')
  )
);

-- =============================================================================
-- #4 Business documents table: clear owner + admin policies
-- =============================================================================

drop policy if exists "MOXT manage business documents" on public.business_documents;
create policy "MOXT manage business documents"
on public.business_documents
for all
to authenticated
using (
  owner_id::text = (select auth.uid())::text
  or public.moxt_owns_business(business_id)
)
with check (
  owner_id::text = (select auth.uid())::text
  or public.moxt_owns_business(business_id)
);

drop policy if exists "MOXT admin read business documents" on public.business_documents;
create policy "MOXT admin read business documents"
on public.business_documents
for select
to authenticated
using (public.moxt_is_admin() or public.moxt_is_moderator());

drop policy if exists "MOXT admin update business documents" on public.business_documents;
create policy "MOXT admin update business documents"
on public.business_documents
for update
to authenticated
using (public.moxt_is_admin() or public.moxt_is_moderator())
with check (public.moxt_is_admin() or public.moxt_is_moderator());

-- =============================================================================
-- #5 Profiles: allow email_verified sync when Auth confirms email
-- =============================================================================

create or replace function private.moxt_profiles_privilege_guard()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_phone_confirmed boolean;
  v_email_confirmed boolean;
  v_jwt_role text := coalesce(auth.jwt() ->> 'role', '');
begin
  if tg_op = 'INSERT' then
    if not public.moxt_is_admin() then
      new.role := 'user';
      new.status := coalesce(nullif(new.status, ''), 'active');
      if new.status = 'verified' then
        new.status := 'active';
      end if;
      new.phone_verified := false;
      new.phone_verified_at := null;
    end if;
    if to_jsonb(new) ? 'email_verified' then
      new.email_verified := false;
    end if;
    if to_jsonb(new) ? 'email_verified_at' then
      new.email_verified_at := null;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.role is distinct from old.role and v_jwt_role <> 'service_role' then
      new.role := old.role;
    end if;

    if not public.moxt_is_admin() then
      new.status := old.status;
      new.referral_code := old.referral_code;

      if new.phone_verified is distinct from old.phone_verified then
        if new.phone_verified = true then
          select u.phone_confirmed_at is not null
          into v_phone_confirmed
          from auth.users u
          where u.id = new.id;

          if coalesce(v_phone_confirmed, false) is not true then
            new.phone_verified := old.phone_verified;
            new.phone_verified_at := old.phone_verified_at;
          end if;
        else
          new.phone_verified := old.phone_verified;
          new.phone_verified_at := old.phone_verified_at;
        end if;
      end if;
    end if;

    -- email_verified : autorisé si Auth a confirmé l'e-mail (miroir téléphone)
    if to_jsonb(new) ? 'email_verified'
       and new.email_verified is distinct from old.email_verified
       and v_jwt_role <> 'service_role'
       and not public.moxt_is_admin() then
      if new.email_verified = true then
        select u.email_confirmed_at is not null
        into v_email_confirmed
        from auth.users u
        where u.id = new.id;

        if coalesce(v_email_confirmed, false) is not true then
          new.email_verified := old.email_verified;
          if to_jsonb(new) ? 'email_verified_at' then
            new.email_verified_at := old.email_verified_at;
          end if;
        end if;
      else
        new.email_verified := old.email_verified;
        if to_jsonb(new) ? 'email_verified_at' then
          new.email_verified_at := old.email_verified_at;
        end if;
      end if;
    end if;

    if to_jsonb(new) ? 'email_verified_at'
       and new.email_verified_at is distinct from old.email_verified_at
       and v_jwt_role <> 'service_role'
       and not public.moxt_is_admin() then
      select u.email_confirmed_at is not null
      into v_email_confirmed
      from auth.users u
      where u.id = new.id;

      if coalesce(v_email_confirmed, false) is not true then
        new.email_verified_at := old.email_verified_at;
      end if;
    end if;
  end if;

  return new;
end;
$$;

notify pgrst, 'reload schema';
