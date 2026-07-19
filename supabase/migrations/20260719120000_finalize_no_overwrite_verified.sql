-- Registration finalize must not overwrite an already phone-verified profile.
-- Prevents PII wipe if a "register" OTP somehow reaches an existing auth user.

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

  -- Idempotent: already verified → return as-is, never clobber name/email/city.
  select * into v_row from public.profiles p where p.id = v_uid;
  if found and coalesce(v_row.phone_verified, false) is true then
    return v_row;
  end if;

  v_phone_norm := public.moxt_normalize_identity_value('phone', v_phone);

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

  begin
    perform public.moxt_register_identity_slot('phone', v_phone_norm, v_uid);
  exception
    when others then
      if sqlerrm like '%MOXT_IDENTITY_%' then
        raise;
      end if;
      null;
  end;

  if v_row.id is null or coalesce(v_row.phone_verified, false) is not true then
    raise exception 'MOXT_FINALIZE_FAILED';
  end if;

  return v_row;
end;
$$;

notify pgrst, 'reload schema';
