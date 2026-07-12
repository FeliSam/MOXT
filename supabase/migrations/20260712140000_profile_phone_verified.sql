-- Vérification téléphone (niveau 1) distincte de la vérification identité MOXT
alter table public.profiles
  add column if not exists phone_verified boolean not null default false,
  add column if not exists phone_verified_at timestamptz;

create unique index if not exists profiles_verified_phone_unique_idx
  on public.profiles (phone)
  where phone <> '' and phone_verified = true;
