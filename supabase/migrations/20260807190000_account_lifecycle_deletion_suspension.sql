-- Cycle de vie compte : 24 h de réflexion après demande de suppression,
-- suspension automatique, puis 30 jours pour demander une réouverture avant purge.

alter table public.profiles
  add column if not exists suspended_at timestamptz,
  add column if not exists purge_at timestamptz,
  add column if not exists suspension_source text,
  add column if not exists reopen_requested_at timestamptz,
  add column if not exists reopen_note text;

alter table public.account_deletion_requests
  add column if not exists suspend_at timestamptz,
  add column if not exists purge_at timestamptz,
  add column if not exists reopen_requested_at timestamptz,
  add column if not exists reopen_note text;

update public.account_deletion_requests
set
  suspend_at = coalesce(suspend_at, created_at + interval '24 hours'),
  purge_at = coalesce(purge_at, created_at + interval '24 hours' + interval '30 days')
where status = 'requested';

-- Défauts à la suspension (admin ou cron)
create or replace function private.moxt_profiles_suspension_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.status = 'suspended' and old.status is distinct from 'suspended' then
    new.suspended_at := coalesce(new.suspended_at, now());
    new.purge_at := coalesce(new.purge_at, now() + interval '30 days');
    if new.suspension_source is null then
      new.suspension_source := 'admin';
    end if;
  elsif tg_op = 'UPDATE' and new.status = 'active' and old.status = 'suspended' then
    new.suspended_at := null;
    new.purge_at := null;
    new.suspension_source := null;
    new.reopen_requested_at := null;
    new.reopen_note := null;
  end if;
  return new;
end;
$$;

drop trigger if exists moxt_profiles_suspension_defaults on public.profiles;
create trigger moxt_profiles_suspension_defaults
  before update of status on public.profiles
  for each row
  execute function private.moxt_profiles_suspension_defaults();

-- Demande de suppression (24 h avant suspension)
create or replace function public.moxt_request_account_deletion(p_request_id text, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_suspend_at timestamptz := v_now + interval '24 hours';
  v_purge_at timestamptz := v_suspend_at + interval '30 days';
begin
  if v_uid is null then
    raise exception 'Session expirée';
  end if;

  if exists (
    select 1
    from public.account_deletion_requests r
    where r.user_id = v_uid
      and r.status = 'requested'
  ) then
    raise exception 'Une demande de suppression est déjà en cours';
  end if;

  insert into public.account_deletion_requests (
    id,
    user_id,
    status,
    created_at,
    suspend_at,
    purge_at,
    reopen_note
  ) values (
    p_request_id,
    v_uid,
    'requested',
    v_now,
    v_suspend_at,
    v_purge_at,
    nullif(trim(coalesce(p_note, '')), '')
  );

  return jsonb_build_object(
    'id', p_request_id,
    'userId', v_uid,
    'status', 'requested',
    'createdAt', v_now,
    'suspendAt', v_suspend_at,
    'purgeAt', v_purge_at
  );
end;
$$;

-- Annulation pendant la période de réflexion (24 h)
create or replace function public.moxt_cancel_account_deletion()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_row public.account_deletion_requests%rowtype;
begin
  if v_uid is null then
    raise exception 'Session expirée';
  end if;

  select *
  into v_row
  from public.account_deletion_requests r
  where r.user_id = v_uid
    and r.status = 'requested'
  order by r.created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'Aucune demande de suppression en cours';
  end if;

  if v_row.suspend_at is not null and v_now >= v_row.suspend_at then
    raise exception 'La période d’annulation est terminée';
  end if;

  update public.account_deletion_requests
  set status = 'cancelled', cancelled_at = v_now
  where id = v_row.id;

  return jsonb_build_object('ok', true, 'cancelledAt', v_now);
end;
$$;

-- Demande de réouverture (compte suspendu, dans les 30 jours)
create or replace function public.moxt_request_account_reopening(p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_profile public.profiles%rowtype;
  v_rec record;
begin
  if v_uid is null then
    raise exception 'Session expirée';
  end if;

  select * into v_profile from public.profiles where id = v_uid;
  if not found or v_profile.status <> 'suspended' then
    raise exception 'Seuls les comptes suspendus peuvent demander une réouverture';
  end if;

  if v_profile.reopen_requested_at is not null then
    raise exception 'Une demande de réouverture est déjà en cours';
  end if;

  if v_profile.purge_at is not null and v_now >= v_profile.purge_at then
    raise exception 'Le délai de réouverture est expiré';
  end if;

  update public.profiles
  set
    reopen_requested_at = v_now,
    reopen_note = nullif(trim(coalesce(p_note, '')), ''),
    updated_at = v_now
  where id = v_uid;

  update public.account_deletion_requests
  set
    reopen_requested_at = v_now,
    reopen_note = nullif(trim(coalesce(p_note, '')), '')
  where user_id = v_uid
    and status = 'requested';

  for v_rec in
    select id from public.profiles where role in ('admin', 'superadmin')
  loop
    insert into public.notifications (
      id,
      user_id,
      title,
      message,
      type,
      link,
      priority,
      read,
      archived,
      created_at,
      updated_at
    ) values (
      'NOT-REOPEN-' || v_uid || '-' || extract(epoch from v_now)::bigint,
      v_rec.id,
      'Demande de réouverture de compte',
      'Un utilisateur suspendu demande la réouverture de son compte MOXT.',
      'moderation',
      '/admin?view=users',
      'high',
      false,
      false,
      v_now,
      v_now
    );
  end loop;

  return jsonb_build_object('ok', true, 'reopenRequestedAt', v_now);
end;
$$;

-- Suppression définitive immédiate (utilisateur suspendu)
create or replace function public.moxt_confirm_permanent_deletion()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Session expirée';
  end if;

  if not exists (
    select 1 from public.profiles p where p.id = v_uid and p.status = 'suspended'
  ) then
    raise exception 'Suppression non autorisée';
  end if;

  perform public.moxt_purge_user_account(v_uid);
end;
$$;

-- Cron : suspension après 24 h + purge après 30 jours (sans demande de réouverture)
create or replace function public.moxt_apply_account_lifecycle()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_rec record;
begin
  update public.profiles p
  set
    status = 'suspended',
    suspended_at = coalesce(p.suspended_at, now()),
    purge_at = coalesce(p.purge_at, r.purge_at),
    suspension_source = 'deletion',
    updated_at = now()
  from public.account_deletion_requests r
  where r.user_id = p.id
    and r.status = 'requested'
    and r.suspend_at is not null
    and r.suspend_at <= now()
    and p.status = 'active';

  for v_rec in
    select p.id
    from public.profiles p
    where p.status = 'suspended'
      and p.purge_at is not null
      and p.purge_at <= now()
      and p.reopen_requested_at is null
  loop
    perform public.moxt_purge_user_account(v_rec.id);
  end loop;
end;
$$;

-- Self-purge : autoriser aussi les comptes suspendus
create or replace function public.moxt_purge_user_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  if p_user_id is null then
    raise exception 'Utilisateur invalide';
  end if;

  if auth.uid() is distinct from p_user_id and not public.moxt_is_admin() then
    raise exception 'Accès refusé';
  end if;

  if auth.uid() = p_user_id and not exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.status in ('pending_deletion', 'suspended')
  ) then
    raise exception 'Suppression non autorisée';
  end if;

  delete from public.profiles where id = p_user_id;

  if exists (select 1 from auth.users u where u.id = p_user_id) then
    delete from auth.users where id = p_user_id;
  end if;

  update public.account_deletion_requests r
  set
    status = 'processed',
    processed_at = coalesce(r.processed_at, now())
  where r.user_id = p_user_id
    and r.status = 'requested';
end;
$$;

revoke all on function public.moxt_request_account_deletion(text, text) from public;
grant execute on function public.moxt_request_account_deletion(text, text) to authenticated;

revoke all on function public.moxt_cancel_account_deletion() from public;
grant execute on function public.moxt_cancel_account_deletion() to authenticated;

revoke all on function public.moxt_request_account_reopening(text) from public;
grant execute on function public.moxt_request_account_reopening(text) to authenticated;

revoke all on function public.moxt_confirm_permanent_deletion() from public;
grant execute on function public.moxt_confirm_permanent_deletion() to authenticated;

revoke all on function public.moxt_apply_account_lifecycle() from public;
grant execute on function public.moxt_apply_account_lifecycle() to authenticated;

create extension if not exists pg_cron;

select cron.schedule(
  'moxt-account-lifecycle',
  '15 * * * *',
  $$select public.moxt_apply_account_lifecycle();$$
)
where not exists (
  select 1 from cron.job where jobname = 'moxt-account-lifecycle'
);

-- Appliquer le cycle de vie pour l'utilisateur connecté (sans attendre le cron)
create or replace function public.moxt_sync_account_lifecycle_for_user()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false);
  end if;

  perform public.moxt_apply_account_lifecycle();

  select * into v_profile from public.profiles where id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'status', v_profile.status,
    'suspendedAt', v_profile.suspended_at,
    'purgeAt', v_profile.purge_at,
    'suspensionSource', v_profile.suspension_source,
    'reopenRequestedAt', v_profile.reopen_requested_at
  );
end;
$$;

revoke all on function public.moxt_sync_account_lifecycle_for_user() from public;
grant execute on function public.moxt_sync_account_lifecycle_for_user() to authenticated;

notify pgrst, 'reload schema';
