-- Single-path phone registration finalize + identity assert fix + dev release tool.
-- Limit counts distinct user_ids; reclaim by a prior user is allowed.
-- Finalize no longer double-calls moxt_register_identity_slot (trigger handles it).

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
  v_user_seen boolean;
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

  select exists (
    select 1
    from public.account_identity_history h
    where h.identity_kind = p_kind
      and h.identity_value = v_value
      and h.user_id = p_user_id
  )
  into v_user_seen;

  -- Lifetime cap: at most 2 distinct users ever. Prior users may reclaim.
  select count(distinct h.user_id)::integer
  into v_total
  from public.account_identity_history h
  where h.identity_kind = p_kind
    and h.identity_value = v_value;

  if v_total >= 2 and coalesce(v_user_seen, false) is not true then
    raise exception 'MOXT_IDENTITY_LIMIT_REACHED';
  end if;
end;
$$;

create or replace function public.moxt_finalize_phone_registration(
  p_first_name text default null,
  p_last_name text default null,
  p_email text default null,
  p_origin_phone text default null,
  p_origin_country text default null,
  p_city text default null,
  p_avatar_url text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_auth auth.users%rowtype;
  v_phone text;
  v_phone_norm text;
  v_now timestamptz := now();
  v_first text;
  v_last text;
  v_email text;
  v_row public.profiles%rowtype;
  v_live uuid;
begin
  if v_uid is null then
    raise exception 'MOXT_SESSION_REQUIRED';
  end if;

  select *
  into v_auth
  from auth.users u
  where u.id = v_uid;

  if not found then
    raise exception 'MOXT_SESSION_REQUIRED';
  end if;

  if v_auth.phone_confirmed_at is null then
    raise exception 'MOXT_PHONE_NOT_CONFIRMED';
  end if;

  v_phone := coalesce(nullif(trim(v_auth.phone), ''), '');
  if v_phone = '' then
    raise exception 'MOXT_PHONE_NOT_CONFIRMED';
  end if;

  v_phone_norm := public.moxt_normalize_identity_value('phone', v_phone);

  -- Drop stale verified phones on other profiles (orphans / unfinished cleanups).
  update public.profiles p
  set
    phone_verified = false,
    phone_verified_at = null,
    updated_at = v_now
  where p.id <> v_uid
    and coalesce(p.phone, '') <> ''
    and public.moxt_normalize_identity_value('phone', p.phone) = v_phone_norm
    and p.phone_verified is true
    and not exists (
      select 1
      from auth.users u
      where u.id = p.id
        and u.phone_confirmed_at is not null
        and public.moxt_normalize_identity_value('phone', coalesce(u.phone, '')) = v_phone_norm
    );

  perform public.moxt_cleanup_stale_identity_slots('phone', v_phone_norm);

  -- Release leftover active slots for non-live owners so this confirmed user can claim.
  update public.account_identity_history h
  set released_at = v_now
  where h.identity_kind = 'phone'
    and h.identity_value = v_phone_norm
    and h.user_id <> v_uid
    and h.released_at is null
    and not exists (
      select 1
      from auth.users u
      where u.id = h.user_id
        and u.phone_confirmed_at is not null
        and public.moxt_normalize_identity_value('phone', coalesce(u.phone, '')) = v_phone_norm
    );

  -- If this user had a released slot, clear released_at so reclaim is a single active row.
  update public.account_identity_history h
  set released_at = null
  where h.identity_kind = 'phone'
    and h.identity_value = v_phone_norm
    and h.user_id = v_uid
    and h.released_at is not null
    and not exists (
      select 1
      from public.account_identity_history h2
      where h2.identity_kind = 'phone'
        and h2.identity_value = v_phone_norm
        and h2.user_id = v_uid
        and h2.released_at is null
    );

  v_live := public.moxt_find_live_identity_owner('phone', v_phone_norm);
  if v_live is not null and v_live <> v_uid then
    raise exception 'MOXT_IDENTITY_ACTIVE';
  end if;

  begin
    perform public.moxt_assert_identity_available('phone', v_phone_norm, v_uid);
  exception
    when others then
      if sqlerrm like '%MOXT_IDENTITY_%' then
        raise;
      end if;
      raise exception 'MOXT_FINALIZE_FAILED';
  end;

  v_first := nullif(trim(coalesce(p_first_name, '')), '');
  if v_first is null then
    v_first := coalesce(
      nullif(trim(coalesce(v_auth.raw_user_meta_data ->> 'first_name', '')), ''),
      'Utilisateur'
    );
  end if;
  v_last := coalesce(nullif(trim(coalesce(p_last_name, '')), ''), '');
  v_email := lower(trim(coalesce(
    nullif(trim(coalesce(p_email, '')), ''),
    coalesce(v_auth.email, ''),
    coalesce(v_auth.raw_user_meta_data ->> 'email', ''),
    ''
  )));

  begin
    insert into public.profiles (
      id,
      first_name,
      last_name,
      email,
      phone,
      origin_phone,
      country,
      origin_country,
      city,
      avatar_url,
      role,
      status,
      phone_verified,
      phone_verified_at,
      activity_visibility,
      updated_at
    )
    values (
      v_uid,
      v_first,
      v_last,
      v_email,
      v_phone,
      coalesce(nullif(trim(coalesce(p_origin_phone, '')), ''), ''),
      'RU',
      coalesce(nullif(trim(coalesce(p_origin_country, '')), ''), 'BJ'),
      coalesce(nullif(trim(coalesce(p_city, '')), ''), ''),
      coalesce(nullif(trim(coalesce(p_avatar_url, '')), ''), ''),
      'user',
      'active',
      true,
      v_now,
      'public',
      v_now
    )
    on conflict (id) do update set
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      email = excluded.email,
      phone = excluded.phone,
      origin_phone = excluded.origin_phone,
      origin_country = excluded.origin_country,
      city = excluded.city,
      avatar_url = excluded.avatar_url,
      phone_verified = true,
      phone_verified_at = coalesce(public.profiles.phone_verified_at, v_now),
      updated_at = v_now
    returning * into v_row;
  exception
    when unique_violation then
      raise exception 'MOXT_IDENTITY_ACTIVE';
    when others then
      if sqlerrm like '%MOXT_IDENTITY_%' then
        raise;
      end if;
      raise exception 'MOXT_FINALIZE_FAILED';
  end;

  -- Slot registration is handled by moxt_profiles_phone_identity_sync on phone_verified.
  -- Ensure active slot exists even if trigger skipped (idempotent).
  begin
    perform public.moxt_register_identity_slot('phone', v_phone_norm, v_uid);
  exception
    when others then
      if sqlerrm like '%MOXT_IDENTITY_%' then
        raise;
      end if;
      -- Slot may already exist via trigger; profile row is the source of truth.
      null;
  end;

  if v_row.id is null or coalesce(v_row.phone_verified, false) is not true then
    raise exception 'MOXT_FINALIZE_FAILED';
  end if;

  return v_row;
end;
$$;

revoke all on function public.moxt_finalize_phone_registration(
  text, text, text, text, text, text, text
) from public;
grant execute on function public.moxt_finalize_phone_registration(
  text, text, text, text, text, text, text
) to authenticated;

-- Dev / ops: free a +7 for retests (stale verified profiles + identity history).
create or replace function public.moxt_dev_release_phone(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_phone text := trim(coalesce(p_phone, ''));
  v_digits text;
  v_norm text;
  v_profiles integer := 0;
  v_slots integer := 0;
begin
  v_digits := regexp_replace(v_phone, '\D', '', 'g');
  if v_digits ~ '^8\d{10}$' then
    v_phone := '+7' || substring(v_digits from 2);
  elsif v_phone like '+%' then
    v_phone := '+' || v_digits;
  elsif length(v_digits) = 11 and v_digits like '7%' then
    v_phone := '+' || v_digits;
  elsif length(v_digits) = 10 then
    v_phone := '+7' || v_digits;
  else
    v_phone := case when v_digits = '' then '' else '+' || v_digits end;
  end if;

  if v_phone = '' then
    raise exception 'MOXT_FINALIZE_FAILED';
  end if;

  v_norm := public.moxt_normalize_identity_value('phone', v_phone);

  update public.profiles p
  set
    phone_verified = false,
    phone_verified_at = null,
    updated_at = now()
  where coalesce(p.phone, '') <> ''
    and public.moxt_normalize_identity_value('phone', p.phone) = v_norm
    and p.phone_verified is true
    and not exists (
      select 1
      from auth.users u
      where u.id = p.id
        and u.phone_confirmed_at is not null
        and public.moxt_normalize_identity_value('phone', coalesce(u.phone, '')) = v_norm
    );
  get diagnostics v_profiles = row_count;

  update public.account_identity_history h
  set released_at = coalesce(h.released_at, now())
  where h.identity_kind = 'phone'
    and h.identity_value = v_norm
    and h.released_at is null
    and not exists (
      select 1
      from auth.users u
      where u.id = h.user_id
        and u.phone_confirmed_at is not null
        and public.moxt_normalize_identity_value('phone', coalesce(u.phone, '')) = v_norm
    );
  get diagnostics v_slots = row_count;

  perform public.moxt_cleanup_stale_identity_slots('phone', v_norm);

  return jsonb_build_object(
    'phone', v_norm,
    'profiles_unverified', v_profiles,
    'slots_released', v_slots
  );
end;
$$;

revoke all on function public.moxt_dev_release_phone(text) from public;
grant execute on function public.moxt_dev_release_phone(text) to service_role;

-- Keep check_identity_available aligned with assert (distinct users; prior user may reclaim).
-- Anon: mask 'active' → 'unavailable' (anti-enumeration); keep 'limit' explicit.
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
  v_user_seen boolean := false;
  v_available boolean := true;
  v_reason text := null;
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
    v_available := false;
    v_reason := 'active';
  end if;

  if v_available then
    if p_user_id is not null then
      select exists (
        select 1
        from public.account_identity_history h
        where h.identity_kind = p_kind
          and h.identity_value = v_value
          and h.user_id = p_user_id
      )
      into v_user_seen;
    end if;

    select count(distinct h.user_id)::integer
    into v_total
    from public.account_identity_history h
    where h.identity_kind = p_kind
      and h.identity_value = v_value;

    if v_total >= 2 and coalesce(v_user_seen, false) is not true then
      v_available := false;
      v_reason := 'limit';
    end if;
  end if;

  if auth.uid() is null and not v_available and v_reason = 'active' then
    return jsonb_build_object('available', false, 'reason', 'unavailable');
  end if;

  return jsonb_build_object('available', v_available, 'reason', v_reason);
end;
$$;

revoke all on function public.moxt_check_identity_available(text, text, uuid) from public;
grant execute on function public.moxt_check_identity_available(text, text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
