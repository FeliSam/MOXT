-- Unconfirmed phone/email Auth rows must not block re-inscription.
-- Pending SMS signups are resumed via auth.signUp / auth.resend, not ALREADY_REGISTERED.

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
        and u.phone_confirmed_at is not null
        and public.moxt_normalize_identity_value('phone', coalesce(u.phone, '')) = p_value
    ) or exists (
      select 1
      from public.profiles p
      where p.id = p_user_id
        and p.phone_verified is true
        and public.moxt_normalize_identity_value('phone', coalesce(p.phone, '')) = p_value
        and coalesce(p.phone, '') <> ''
    )
    when p_kind = 'email' then exists (
      select 1
      from auth.users u
      where u.id = p_user_id
        and u.email_confirmed_at is not null
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
    where u.phone_confirmed_at is not null
      and public.moxt_normalize_identity_value('phone', coalesce(u.phone, '')) = v_value
    limit 1;

    if v_owner is not null then
      return v_owner;
    end if;

    select p.id
    into v_owner
    from public.profiles p
    where p.phone_verified is true
      and public.moxt_normalize_identity_value('phone', coalesce(p.phone, '')) = v_value
      and coalesce(p.phone, '') <> ''
    limit 1;

    return v_owner;
  end if;

  if p_kind = 'email' then
    select u.id
    into v_owner
    from auth.users u
    where u.email_confirmed_at is not null
      and public.moxt_normalize_identity_value('email', coalesce(u.email, '')) = v_value
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

revoke all on function public.moxt_user_owns_identity(uuid, text, text) from public;
revoke all on function public.moxt_find_live_identity_owner(text, text) from public;

-- Free slots left open by unconfirmed Auth rows after earlier cleanups.
select public.moxt_cleanup_stale_identity_slots(null, null);

notify pgrst, 'reload schema';
