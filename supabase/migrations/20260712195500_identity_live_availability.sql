-- Disponibilité e-mail / téléphone : bloquer seulement si un compte actif existe encore.
-- Libère les emplacements d'identité orphelins après suppression manuelle d'un utilisateur.

create or replace function public.moxt_user_owns_identity(
  p_user_id uuid,
  p_kind text,
  p_value text
)
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select case
    when p_kind = 'phone' then exists (
      select 1
      from auth.users u
      where u.id = p_user_id
        and public.moxt_normalize_identity_value('phone', coalesce(u.phone, '')) = p_value
    ) or exists (
      select 1
      from public.profiles p
      where p.id = p_user_id
        and public.moxt_normalize_identity_value('phone', coalesce(p.phone, '')) = p_value
        and coalesce(p.phone, '') <> ''
    )
    when p_kind = 'email' then exists (
      select 1
      from auth.users u
      where u.id = p_user_id
        and public.moxt_normalize_identity_value('email', coalesce(u.email, '')) = p_value
    ) or exists (
      select 1
      from public.profiles p
      where p.id = p_user_id
        and public.moxt_normalize_identity_value('email', coalesce(p.email, '')) = p_value
        and coalesce(p.email, '') <> ''
    )
    else false
  end;
$$;

create or replace function public.moxt_find_live_identity_owner(
  p_kind text,
  p_value text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_value text := public.moxt_normalize_identity_value(p_kind, p_value);
  v_owner uuid;
begin
  if v_value = '' then
    return null;
  end if;

  if p_kind = 'phone' then
    select u.id
    into v_owner
    from auth.users u
    where public.moxt_normalize_identity_value('phone', coalesce(u.phone, '')) = v_value
    limit 1;

    if v_owner is not null then
      return v_owner;
    end if;

    select p.id
    into v_owner
    from public.profiles p
    where public.moxt_normalize_identity_value('phone', coalesce(p.phone, '')) = v_value
      and coalesce(p.phone, '') <> ''
    limit 1;

    return v_owner;
  end if;

  if p_kind = 'email' then
    select u.id
    into v_owner
    from auth.users u
    where public.moxt_normalize_identity_value('email', coalesce(u.email, '')) = v_value
    limit 1;

    if v_owner is not null then
      return v_owner;
    end if;

    select p.id
    into v_owner
    from public.profiles p
    where public.moxt_normalize_identity_value('email', coalesce(p.email, '')) = v_value
      and coalesce(p.email, '') <> ''
    limit 1;

    return v_owner;
  end if;

  return null;
end;
$$;

create or replace function public.moxt_cleanup_stale_identity_slots(
  p_kind text,
  p_value text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_value text := case
    when p_value is null then null
    else public.moxt_normalize_identity_value(p_kind, p_value)
  end;
begin
  update public.account_identity_history h
  set released_at = coalesce(h.released_at, now())
  where h.released_at is null
    and (p_kind is null or h.identity_kind = p_kind)
    and (v_value is null or h.identity_value = v_value)
    and not exists (
      select 1
      from auth.users u
      where u.id = h.user_id
    );

  update public.account_identity_history h
  set released_at = coalesce(h.released_at, now())
  where h.released_at is null
    and (p_kind is null or h.identity_kind = p_kind)
    and (v_value is null or h.identity_value = v_value)
    and exists (
      select 1
      from auth.users u
      where u.id = h.user_id
    )
    and not public.moxt_user_owns_identity(h.user_id, h.identity_kind, h.identity_value);
end;
$$;

create or replace function public.moxt_assert_identity_available(
  p_kind text,
  p_value text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_value text := public.moxt_normalize_identity_value(p_kind, p_value);
  v_total integer;
  v_live_owner uuid;
begin
  if v_value = '' then
    return;
  end if;

  perform public.moxt_cleanup_stale_identity_slots(p_kind, v_value);

  if exists (
    select 1
    from public.account_identity_history h
    where h.identity_kind = p_kind
      and h.identity_value = v_value
      and h.user_id = p_user_id
      and h.released_at is null
  ) then
    return;
  end if;

  v_live_owner := public.moxt_find_live_identity_owner(p_kind, v_value);
  if v_live_owner is not null and v_live_owner <> p_user_id then
    raise exception 'MOXT_IDENTITY_ACTIVE';
  end if;

  select count(*)::integer
  into v_total
  from public.account_identity_history h
  where h.identity_kind = p_kind
    and h.identity_value = v_value;

  if v_total >= 2 then
    raise exception 'MOXT_IDENTITY_LIMIT_REACHED';
  end if;
end;
$$;

create or replace function public.moxt_check_identity_available(
  p_kind text,
  p_value text,
  p_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_value text := public.moxt_normalize_identity_value(p_kind, p_value);
  v_total integer;
  v_live_owner uuid;
begin
  if v_value = '' then
    return jsonb_build_object('available', true, 'reason', null);
  end if;

  perform public.moxt_cleanup_stale_identity_slots(p_kind, v_value);

  if p_user_id is not null and exists (
    select 1
    from public.account_identity_history h
    where h.identity_kind = p_kind
      and h.identity_value = v_value
      and h.user_id = p_user_id
      and h.released_at is null
  ) then
    return jsonb_build_object('available', true, 'reason', null);
  end if;

  v_live_owner := public.moxt_find_live_identity_owner(p_kind, v_value);
  if v_live_owner is not null and (p_user_id is null or v_live_owner <> p_user_id) then
    return jsonb_build_object('available', false, 'reason', 'active');
  end if;

  select count(*)::integer
  into v_total
  from public.account_identity_history h
  where h.identity_kind = p_kind
    and h.identity_value = v_value;

  if v_total >= 2 then
    return jsonb_build_object('available', false, 'reason', 'limit');
  end if;

  return jsonb_build_object('available', true, 'reason', null);
end;
$$;

create or replace function private.moxt_profiles_identity_release()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(old.phone, '') <> '' then
    perform public.moxt_release_identity_slot('phone', old.phone, old.id);
  end if;
  if coalesce(old.email, '') <> '' then
    perform public.moxt_release_identity_slot('email', old.email, old.id);
  end if;
  return old;
end;
$$;

drop trigger if exists moxt_profiles_identity_release on public.profiles;
create trigger moxt_profiles_identity_release
  before delete on public.profiles
  for each row
  execute function private.moxt_profiles_identity_release();

revoke all on function public.moxt_user_owns_identity(uuid, text, text) from public;
revoke all on function public.moxt_find_live_identity_owner(text, text) from public;
revoke all on function public.moxt_cleanup_stale_identity_slots(text, text) from public;

grant execute on function public.moxt_check_identity_available(text, text, uuid) to anon, authenticated;

-- Nettoyage des emplacements laissés actifs après suppressions manuelles.
select public.moxt_cleanup_stale_identity_slots(null, null);

notify pgrst, 'reload schema';
