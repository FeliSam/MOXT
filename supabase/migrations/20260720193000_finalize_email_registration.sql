-- Finalize registration after e-mail OTP (SMS number/provider denied path).
-- Requires email_confirmed_at; stores phone as unverified (no verified identity slot).

create or replace function public.moxt_finalize_email_registration(
  p_first_name text default null,
  p_last_name text default null,
  p_email text default null,
  p_phone text default null,
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

  if v_auth.email_confirmed_at is null then
    raise exception 'MOXT_EMAIL_NOT_CONFIRMED';
  end if;

  v_email := lower(trim(coalesce(
    nullif(trim(coalesce(p_email, '')), ''),
    coalesce(v_auth.email, ''),
    coalesce(v_auth.raw_user_meta_data ->> 'email', ''),
    ''
  )));
  if position('@' in v_email) = 0 then
    raise exception 'MOXT_EMAIL_NOT_CONFIRMED';
  end if;

  v_phone := coalesce(
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(v_auth.raw_user_meta_data ->> 'phone', '')), ''),
    nullif(trim(coalesce(v_auth.phone, '')), ''),
    ''
  );

  v_first := nullif(trim(coalesce(p_first_name, '')), '');
  if v_first is null then
    v_first := coalesce(
      nullif(trim(coalesce(v_auth.raw_user_meta_data ->> 'first_name', '')), ''),
      'Utilisateur'
    );
  end if;
  v_last := coalesce(
    nullif(trim(coalesce(p_last_name, '')), ''),
    nullif(trim(coalesce(v_auth.raw_user_meta_data ->> 'last_name', '')), ''),
    ''
  );

  -- If phone present, ensure no other verified owner holds it; do not claim verified slot.
  if v_phone <> '' then
    v_phone_norm := public.moxt_normalize_identity_value('phone', v_phone);
    v_live := public.moxt_find_live_identity_owner('phone', v_phone_norm);
    if v_live is not null and v_live <> v_uid then
      raise exception 'MOXT_IDENTITY_ACTIVE';
    end if;
  end if;

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
      coalesce(
        nullif(trim(coalesce(p_origin_country, '')), ''),
        nullif(trim(coalesce(v_auth.raw_user_meta_data ->> 'origin_country', '')), ''),
        'BJ'
      ),
      coalesce(
        nullif(trim(coalesce(p_city, '')), ''),
        nullif(trim(coalesce(v_auth.raw_user_meta_data ->> 'city', '')), ''),
        ''
      ),
      coalesce(
        nullif(trim(coalesce(p_avatar_url, '')), ''),
        nullif(trim(coalesce(v_auth.raw_user_meta_data ->> 'avatar_url', '')), ''),
        ''
      ),
      'user',
      'active',
      false,
      null,
      'public',
      v_now
    )
    on conflict (id) do update set
      first_name = case
        when length(trim(coalesce(public.profiles.first_name, ''))) >= 2 then public.profiles.first_name
        else excluded.first_name
      end,
      last_name = case
        when length(trim(coalesce(public.profiles.last_name, ''))) >= 2 then public.profiles.last_name
        else excluded.last_name
      end,
      email = case
        when position('@' in coalesce(public.profiles.email, '')) > 0 then public.profiles.email
        else excluded.email
      end,
      phone = case
        when coalesce(public.profiles.phone_verified, false) is true then public.profiles.phone
        else excluded.phone
      end,
      origin_phone = case
        when length(trim(coalesce(public.profiles.origin_phone, ''))) > 0 then public.profiles.origin_phone
        else excluded.origin_phone
      end,
      origin_country = case
        when length(trim(coalesce(public.profiles.origin_country, ''))) >= 2 then public.profiles.origin_country
        else excluded.origin_country
      end,
      city = case
        when length(trim(coalesce(public.profiles.city, ''))) >= 2 then public.profiles.city
        else excluded.city
      end,
      avatar_url = case
        when length(trim(coalesce(public.profiles.avatar_url, ''))) > 0 then public.profiles.avatar_url
        else excluded.avatar_url
      end,
      -- Keep verified phone if already set; otherwise stay unverified after e-mail signup.
      phone_verified = case
        when coalesce(public.profiles.phone_verified, false) is true then true
        else false
      end,
      phone_verified_at = case
        when coalesce(public.profiles.phone_verified, false) is true then public.profiles.phone_verified_at
        else null
      end,
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

  if v_row.id is null then
    raise exception 'MOXT_FINALIZE_FAILED';
  end if;

  return v_row;
end;
$$;

revoke all on function public.moxt_finalize_email_registration(
  text, text, text, text, text, text, text, text
) from public;

grant execute on function public.moxt_finalize_email_registration(
  text, text, text, text, text, text, text, text
) to authenticated;
