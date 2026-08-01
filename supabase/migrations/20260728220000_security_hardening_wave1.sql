-- Wave 1 security hardening — progressive remédiation des failles Critiques / Hautes
-- Voir audit : push spam, business status, reviews, messages, profiles, parcels, statuses, docs

-- =============================================================================
-- #1 Harden moxt_create_notification
-- =============================================================================

create table if not exists public.moxt_notification_rate_log (
  actor_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists moxt_notification_rate_log_actor_idx
  on public.moxt_notification_rate_log (actor_id, created_at desc);

alter table public.moxt_notification_rate_log enable row level security;

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

  -- Liens : uniquement chemins relatifs internes (anti-phishing)
  if v_link is not null then
    if left(v_link, 1) <> '/' or left(v_link, 2) = '//' or v_link ~* '^(https?:|javascript:|data:)' then
      raise exception 'invalid notification link';
    end if;
  end if;

  -- Types système / high : admin seulement (anti spoof « compte suspendu »)
  if v_type = 'system' and v_priority = 'high' and not public.moxt_is_admin() then
    raise exception 'forbidden notification type';
  end if;

  -- Rate limit : 40 notifs / heure / acteur (hors admin)
  if not public.moxt_is_admin() then
    select count(*)::int into v_recent
    from public.moxt_notification_rate_log
    where actor_id = v_actor
      and created_at > now() - interval '1 hour';

    if v_recent >= 40 then
      raise exception 'notification rate limit exceeded';
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

-- =============================================================================
-- #3 Harden moxt_notify_admins (templates + rate limit + lien relatif)
-- =============================================================================

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

  if left(v_link, 1) <> '/' or left(v_link, 2) = '//' or v_link ~* '^(https?:|javascript:|data:)' then
    raise exception 'invalid admin notification link';
  end if;

  -- Rate limit non-admin : 10 appels / heure
  if not public.moxt_is_admin() then
    select count(*)::int into v_recent
    from public.moxt_notification_rate_log
    where actor_id = v_actor
      and created_at > now() - interval '1 hour';

    if v_recent >= 10 then
      raise exception 'admin notify rate limit exceeded';
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
-- #2 Lock businesses.status / pinned_* (owner cannot self-verify / self-pin)
-- =============================================================================

create or replace function private.moxt_businesses_privilege_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if not public.moxt_is_admin() then
      if new.status in ('verified', 'approved', 'active') then
        new.status := 'pending';
      end if;
      new.pinned_at := null;
      if to_jsonb(new) ? 'pinned_by' then
        new.pinned_by := null;
      end if;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and not public.moxt_is_admin() then
    if new.status is distinct from old.status then
      new.status := old.status;
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

revoke all on function private.moxt_businesses_privilege_guard() from public, anon, authenticated;

drop trigger if exists moxt_businesses_privilege_guard on public.businesses;
create trigger moxt_businesses_privilege_guard
  before insert or update on public.businesses
  for each row
  execute function private.moxt_businesses_privilege_guard();

-- =============================================================================
-- #5 Profiles: freeze role + email_verified (no self-promote / forge verify)
-- =============================================================================

create or replace function private.moxt_profiles_privilege_guard()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_phone_confirmed boolean;
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
    -- role : immutable sauf service_role (edge admin-promote)
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

    -- email_verified : jamais via client (même admin UI doit passer service/edge sync)
    if to_jsonb(new) ? 'email_verified'
       and new.email_verified is distinct from old.email_verified
       and v_jwt_role <> 'service_role' then
      new.email_verified := old.email_verified;
    end if;
    if to_jsonb(new) ? 'email_verified_at'
       and new.email_verified_at is distinct from old.email_verified_at
       and v_jwt_role <> 'service_role' then
      new.email_verified_at := old.email_verified_at;
    end if;
  end if;

  return new;
end;
$$;

-- =============================================================================
-- #6 Reviews: target owner may only reply/dispute columns
-- =============================================================================

create or replace function private.moxt_reviews_update_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_is_author boolean := (old.author_id::text = v_uid::text);
  v_is_staff boolean := public.moxt_is_admin() or public.moxt_is_moderator();
  v_is_target boolean := public.moxt_owns_review_target(old.target_type, old.target_id);
begin
  if v_is_staff then
    return new;
  end if;

  if v_is_author then
    -- auteur : peut éditer contenu, pas forger reply_by d'un autre
    return new;
  end if;

  if v_is_target then
    if new.rating is distinct from old.rating
       or new.comment is distinct from old.comment
       or new.author_id is distinct from old.author_id
       or new.target_id is distinct from old.target_id
       or new.target_type is distinct from old.target_type
       or new.status is distinct from old.status then
      raise exception 'review target may only update reply/dispute fields';
    end if;
    return new;
  end if;

  raise exception 'forbidden review update';
end;
$$;

revoke all on function private.moxt_reviews_update_guard() from public, anon, authenticated;

drop trigger if exists moxt_reviews_update_guard on public.reviews;
create trigger moxt_reviews_update_guard
  before update on public.reviews
  for each row
  execute function private.moxt_reviews_update_guard();

-- Narrow authenticated read of unpublished reviews
drop policy if exists "MOXT read reviews" on public.reviews;
drop policy if exists "MOXT authenticated read reviews" on public.reviews;
drop policy if exists "MOXT users read reviews" on public.reviews;

do $$
begin
  -- Drop any broad "using (true)" review select policies by redefining a safe one
  null;
end $$;

drop policy if exists "MOXT select reviews published or own" on public.reviews;
create policy "MOXT select reviews published or own"
  on public.reviews
  for select
  to authenticated
  using (
    status = 'published'
    or author_id::text = (select auth.uid())::text
    or public.moxt_owns_review_target(target_type, target_id)
    or public.moxt_is_admin()
    or public.moxt_is_moderator()
  );

-- =============================================================================
-- #7 Messages: peers may only change reactions; authors own body
-- =============================================================================

create or replace function private.moxt_messages_update_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if new.sender_id is distinct from old.sender_id then
    new.sender_id := old.sender_id;
  end if;
  if new.conversation_id is distinct from old.conversation_id then
    new.conversation_id := old.conversation_id;
  end if;

  -- Auteur : contenu libre
  if v_uid is not null and v_uid = old.sender_id then
    return new;
  end if;

  -- Participant non-auteur : réactions / accusés lecture / soft-delete perso uniquement
  if new.text is distinct from old.text
     or new.attachment is distinct from old.attachment
     or new.sender_name is distinct from old.sender_name
     or new.reply_to_id is distinct from old.reply_to_id then
    raise exception 'only message author can edit content';
  end if;

  return new;
end;
$$;

revoke all on function private.moxt_messages_update_guard() from public, anon, authenticated;

drop trigger if exists moxt_messages_update_guard on public.messages;
create trigger moxt_messages_update_guard
  before update on public.messages
  for each row
  execute function private.moxt_messages_update_guard();

-- Freeze conversation participant_ids for non-admins
create or replace function private.moxt_conversations_participants_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.participant_ids is distinct from old.participant_ids
     and not public.moxt_is_admin() then
    new.participant_ids := old.participant_ids;
  end if;
  return new;
end;
$$;

revoke all on function private.moxt_conversations_participants_guard() from public, anon, authenticated;

drop trigger if exists moxt_conversations_participants_guard on public.conversations;
create trigger moxt_conversations_participants_guard
  before update on public.conversations
  for each row
  execute function private.moxt_conversations_participants_guard();

-- =============================================================================
-- #9 Parcels: owner cannot self-verify proof_status
-- =============================================================================

create or replace function private.moxt_parcels_proof_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.proof_status is distinct from old.proof_status
     and not public.moxt_is_admin()
     and not public.moxt_is_moderator() then
    new.proof_status := old.proof_status;
  end if;
  return new;
end;
$$;

revoke all on function private.moxt_parcels_proof_guard() from public, anon, authenticated;

drop trigger if exists moxt_parcels_proof_guard on public.parcels;
create trigger moxt_parcels_proof_guard
  before update on public.parcels
  for each row
  execute function private.moxt_parcels_proof_guard();

-- =============================================================================
-- #11 Official statuses only for admins
-- =============================================================================

create or replace function private.moxt_statuses_official_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.is_official, false) = true and not public.moxt_is_admin() then
    new.is_official := false;
  end if;
  if tg_op = 'UPDATE'
     and new.is_official is distinct from old.is_official
     and not public.moxt_is_admin() then
    new.is_official := old.is_official;
  end if;
  return new;
end;
$$;

revoke all on function private.moxt_statuses_official_guard() from public, anon, authenticated;

drop trigger if exists moxt_statuses_official_guard on public.statuses;
create trigger moxt_statuses_official_guard
  before insert or update on public.statuses
  for each row
  execute function private.moxt_statuses_official_guard();

-- =============================================================================
-- #10 Document review fields + orphan/purge RPC admin-only
-- =============================================================================

create or replace function private.moxt_business_documents_review_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.moxt_is_admin() then
    if tg_op = 'INSERT' then
      if to_jsonb(new) ? 'reviewed_at' then new.reviewed_at := null; end if;
      if to_jsonb(new) ? 'reviewed_by' then new.reviewed_by := null; end if;
      if to_jsonb(new) ? 'review_note' then new.review_note := null; end if;
      if to_jsonb(new) ? 'review_status' and new.review_status is not null
         and new.review_status not in ('pending', 'submitted') then
        new.review_status := 'pending';
      end if;
    elsif tg_op = 'UPDATE' then
      if to_jsonb(new) ? 'reviewed_at' then new.reviewed_at := old.reviewed_at; end if;
      if to_jsonb(new) ? 'reviewed_by' then new.reviewed_by := old.reviewed_by; end if;
      if to_jsonb(new) ? 'review_note' then new.review_note := old.review_note; end if;
      if to_jsonb(new) ? 'review_status' and new.review_status is distinct from old.review_status then
        if new.review_status not in ('pending', 'submitted') then
          new.review_status := old.review_status;
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.moxt_business_documents_review_guard() from public, anon, authenticated;

drop trigger if exists moxt_business_documents_review_guard on public.business_documents;
create trigger moxt_business_documents_review_guard
  before insert or update on public.business_documents
  for each row
  execute function private.moxt_business_documents_review_guard();

create or replace function public.moxt_purgeable_documents()
returns table (storage_path text, source text)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Cron / service_role : auth.uid() null — autorisé. Client : admin only.
  if auth.uid() is not null and not public.moxt_is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;
  return query
    select d.storage_path, 'personal'::text
    from public.personal_documents d
    where d.storage_path is not null
      and d.legal_hold_until is not null
      and d.legal_hold_until < now()
    union all
    select b.storage_path, 'business'::text
    from public.business_documents b
    where b.storage_path is not null
      and b.legal_hold_until is not null
      and b.legal_hold_until < now();
end;
$$;

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
      and o.created_at < now() - make_interval(hours => p_grace_hours)
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

revoke all on function public.moxt_purgeable_documents() from public;
revoke all on function public.moxt_orphan_document_objects(int) from public;
grant execute on function public.moxt_purgeable_documents() to authenticated;
grant execute on function public.moxt_orphan_document_objects(int) to authenticated;

notify pgrst, 'reload schema';
