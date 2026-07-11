-- Extraction des noms Google (full_name / name / picture) à la création du profil

create or replace function private.handle_new_moxt_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
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
    updated_at
  )
  values (
    new.id,
    coalesce(meta ->> 'first_name', nullif(name_parts[1], ''), 'Utilisateur'),
    coalesce(meta ->> 'last_name', nullif(array_to_string(name_parts[2:array_length(name_parts, 1)], ' '), ''), ''),
    coalesce(new.email, meta ->> 'email', ''),
    coalesce(new.phone, meta ->> 'phone', ''),
    coalesce(meta ->> 'origin_phone', ''),
    'RU',
    coalesce(meta ->> 'origin_country', 'BJ'),
    coalesce(meta ->> 'city', ''),
    coalesce(meta ->> 'avatar_url', meta ->> 'picture', ''),
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
