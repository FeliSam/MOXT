-- Do not create public.profiles on auth.users INSERT until phone or e-mail is confirmed.
-- Phone OTP signup previously created orphan-looking profiles before SMS verify while the
-- browser had no durable session — profile row existed but login failed.

create or replace function private.ensure_moxt_profile_from_auth_user(p_user auth.users)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(p_user.raw_user_meta_data, '{}'::jsonb);
  full_name text := coalesce(meta ->> 'full_name', meta ->> 'name', '');
  name_parts text[];
begin
  name_parts := regexp_split_to_array(trim(full_name), '\s+');

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
    activity_visibility,
    updated_at
  )
  values (
    p_user.id,
    coalesce(meta ->> 'first_name', nullif(name_parts[1], ''), 'Utilisateur'),
    coalesce(meta ->> 'last_name', nullif(array_to_string(name_parts[2:array_length(name_parts, 1)], ' '), ''), ''),
    coalesce(p_user.email, meta ->> 'email', ''),
    coalesce(p_user.phone, meta ->> 'phone', ''),
    coalesce(meta ->> 'origin_phone', ''),
    'RU',
    coalesce(meta ->> 'origin_country', 'BJ'),
    coalesce(meta ->> 'city', ''),
    coalesce(meta ->> 'avatar_url', meta ->> 'picture', ''),
    'user',
    'active',
    'public',
    now()
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
    updated_at = excluded.updated_at;
end;
$$;

revoke all on function private.ensure_moxt_profile_from_auth_user(auth.users) from public, anon, authenticated;

create or replace function private.handle_new_moxt_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.phone_confirmed_at is null and new.email_confirmed_at is null then
    return new;
  end if;

  perform private.ensure_moxt_profile_from_auth_user(new);
  return new;
end;
$$;

create or replace function private.handle_auth_user_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (old.phone_confirmed_at is null and new.phone_confirmed_at is not null)
     or (old.email_confirmed_at is null and new.email_confirmed_at is not null) then
    perform private.ensure_moxt_profile_from_auth_user(new);
  end if;
  return new;
end;
$$;

revoke all on function private.handle_auth_user_confirmed() from public, anon, authenticated;

drop trigger if exists on_auth_user_confirmed_ensure_moxt_profile on auth.users;
create trigger on_auth_user_confirmed_ensure_moxt_profile
  after update of phone_confirmed_at, email_confirmed_at on auth.users
  for each row
  execute function private.handle_auth_user_confirmed();

notify pgrst, 'reload schema';
