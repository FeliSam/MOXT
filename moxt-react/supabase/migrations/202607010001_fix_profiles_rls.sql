alter table public.profiles enable row level security;

drop policy if exists "MOXT users can read own profile" on public.profiles;
create policy "MOXT users can read own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "MOXT users can create own profile" on public.profiles;
create policy "MOXT users can create own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "MOXT users can update own profile" on public.profiles;
create policy "MOXT users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

grant select, insert, update on table public.profiles to authenticated;

-- With e-mail confirmation enabled, signUp returns no browser session. This
-- trigger creates the profile from the trusted auth.users event instead.
create schema if not exists private;

create or replace function private.handle_new_moxt_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
    updated_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', 'Utilisateur'),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.email, new.raw_user_meta_data ->> 'email', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'origin_phone', ''),
    'RU',
    coalesce(new.raw_user_meta_data ->> 'origin_country', 'BJ'),
    coalesce(new.raw_user_meta_data ->> 'city', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    'user',
    'active',
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

  return new;
end;
$$;

revoke all on function private.handle_new_moxt_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_create_moxt_profile on auth.users;
create trigger on_auth_user_created_create_moxt_profile
after insert on auth.users
for each row execute function private.handle_new_moxt_user();
