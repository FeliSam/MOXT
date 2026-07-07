create table if not exists public.listings (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  business_id text,
  seller_name text not null default '',
  seller_type text not null default 'person',
  title text not null,
  description text not null default '',
  type text not null default 'product',
  category text not null default '',
  status text not null default 'active',
  price numeric not null default 0,
  currency text not null default 'RUB',
  country text not null default 'RU',
  city text not null default 'Moscou',
  address text not null default '',
  images jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.listings add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.listings add column if not exists business_id text;
alter table public.listings add column if not exists seller_name text not null default '';
alter table public.listings add column if not exists seller_type text not null default 'person';
alter table public.listings add column if not exists title text not null default '';
alter table public.listings add column if not exists description text not null default '';
alter table public.listings add column if not exists type text not null default 'product';
alter table public.listings add column if not exists category text not null default '';
alter table public.listings add column if not exists status text not null default 'active';
alter table public.listings add column if not exists price numeric not null default 0;
alter table public.listings add column if not exists currency text not null default 'RUB';
alter table public.listings add column if not exists country text not null default 'RU';
alter table public.listings add column if not exists city text not null default 'Moscou';
alter table public.listings add column if not exists address text not null default '';
alter table public.listings add column if not exists images jsonb not null default '[]'::jsonb;
alter table public.listings add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.listings add column if not exists created_at timestamptz not null default now();
alter table public.listings add column if not exists updated_at timestamptz not null default now();
alter table public.listings add column if not exists expires_at timestamptz;

create index if not exists listings_status_created_at_idx
on public.listings (status, created_at desc);

create index if not exists listings_owner_id_idx
on public.listings (owner_id);

alter table public.listings enable row level security;
alter table public.listings replica identity full;

drop policy if exists "MOXT authenticated users can view listings" on public.listings;
create policy "MOXT authenticated users can view listings"
on public.listings
for select
to authenticated
using (
  status = 'active'
  or owner_id::text = (select auth.uid())::text
  or exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin', 'superadmin')
  )
);

drop policy if exists "MOXT users can create own listings" on public.listings;
create policy "MOXT users can create own listings"
on public.listings
for insert
to authenticated
with check (owner_id::text = (select auth.uid())::text);

drop policy if exists "MOXT users can update own listings" on public.listings;
create policy "MOXT users can update own listings"
on public.listings
for update
to authenticated
using (
  owner_id::text = (select auth.uid())::text
  or exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin', 'superadmin')
  )
)
with check (
  owner_id::text = (select auth.uid())::text
  or exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin', 'superadmin')
  )
);

drop policy if exists "MOXT users can delete own listings" on public.listings;
create policy "MOXT users can delete own listings"
on public.listings
for delete
to authenticated
using (
  owner_id::text = (select auth.uid())::text
  or exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin', 'superadmin')
  )
);

grant select, insert, update, delete on table public.listings to authenticated;

insert into storage.buckets (id, name, public)
values ('listings', 'listings', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "MOXT public listing images" on storage.objects;
create policy "MOXT public listing images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'listings');

drop policy if exists "MOXT users can upload own listing images" on storage.objects;
create policy "MOXT users can upload own listing images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listings'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "MOXT users can update own listing images" on storage.objects;
create policy "MOXT users can update own listing images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listings'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'listings'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "MOXT users can delete own listing images" on storage.objects;
create policy "MOXT users can delete own listing images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listings'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'listings'
  ) then
    alter publication supabase_realtime add table public.listings;
  end if;
end;
$$;

notify pgrst, 'reload schema';
