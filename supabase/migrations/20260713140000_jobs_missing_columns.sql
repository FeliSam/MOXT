-- Colonnes jobs manquantes sur des bases déjà créées (create table if not exists n'ajoute pas les colonnes).

alter table public.jobs add column if not exists publisher_name text not null default '';
alter table public.jobs add column if not exists business_id text;
alter table public.jobs add column if not exists title text not null default '';
alter table public.jobs add column if not exists sector text not null default '';
alter table public.jobs add column if not exists contract_type text not null default '';
alter table public.jobs add column if not exists experience_level text not null default '';
alter table public.jobs add column if not exists language text not null default '';
alter table public.jobs add column if not exists salary text not null default '';
alter table public.jobs add column if not exists salary_period text not null default '';
alter table public.jobs add column if not exists description text not null default '';
alter table public.jobs add column if not exists requirements text not null default '';
alter table public.jobs add column if not exists benefits text not null default '';
alter table public.jobs add column if not exists location text not null default '';
alter table public.jobs add column if not exists remote boolean not null default false;
alter table public.jobs add column if not exists start_date text;
alter table public.jobs add column if not exists application_deadline text;
alter table public.jobs add column if not exists publisher_type text not null default 'personal';
alter table public.jobs add column if not exists status text not null default 'active';
alter table public.jobs add column if not exists expires_at timestamptz;
alter table public.jobs add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.jobs add column if not exists created_at timestamptz not null default now();
alter table public.jobs add column if not exists updated_at timestamptz not null default now();
alter table public.jobs add column if not exists owner_id uuid references auth.users (id) on delete cascade;
