-- Sync etendue : entreprise (membres/docs/demandes), avis, signalements, P2P, identite

-- Reviews
create table if not exists public.reviews (
  id text primary key,
  target_type text not null default '',
  target_id text not null default '',
  author_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default '',
  rating numeric not null default 5,
  comment text not null default '',
  status text not null default 'published',
  moderated_at timestamptz,
  moderated_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists reviews_target_idx on public.reviews (target_type, target_id);
create index if not exists reviews_author_idx on public.reviews (author_id);

-- P2P
create table if not exists public.p2p_offers (
  id text primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  owner_name text not null default '',
  amount numeric not null default 0,
  from_currency text not null default 'RUB',
  to_currency text not null default 'XOF',
  rate numeric not null default 0,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.p2p_orders (
  id text primary key,
  offer_id text not null,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  buyer_name text not null default '',
  seller_id uuid not null references auth.users (id) on delete cascade,
  seller_name text not null default '',
  amount numeric not null default 0,
  from_currency text not null default 'RUB',
  to_currency text not null default 'XOF',
  rate numeric not null default 0,
  fee numeric not null default 0,
  status text not null default 'created',
  proofs jsonb not null default '[]'::jsonb,
  ratings jsonb not null default '[]'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.p2p_orders add column if not exists proofs jsonb not null default '[]'::jsonb;
alter table public.p2p_orders add column if not exists ratings jsonb not null default '[]'::jsonb;
alter table public.p2p_orders add column if not exists timeline jsonb not null default '[]'::jsonb;

-- Entreprise : membres, documents, demandes
create table if not exists public.business_members (
  id text primary key,
  business_id text not null,
  name text not null default '',
  email text not null default '',
  role text not null default 'editor',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_documents (
  id text primary key,
  business_id text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  category text not null default 'company',
  name text not null default '',
  size integer not null default 0,
  type text not null default 'application/octet-stream',
  status text not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_requests (
  id text primary key,
  business_id text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  related_type text not null default '',
  related_id text not null default '',
  title text not null default '',
  requester_name text not null default '',
  status text not null default 'submitted',
  timeline jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Signalements
create table if not exists public.listing_reports (
  id text primary key,
  listing_id text not null,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null default '',
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.job_reports (
  id text primary key,
  job_id text not null,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null default '',
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.event_reports (
  id text primary key,
  event_id text not null,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null default '',
  status text not null default 'new',
  created_at timestamptz not null default now()
);

-- Profils identite
create table if not exists public.identity_profiles (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  owner_type text not null default 'PERSON',
  identity jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists identity_profiles_user_idx on public.identity_profiles (user_id);

-- RLS
alter table public.reviews enable row level security;
alter table public.p2p_offers enable row level security;
alter table public.p2p_orders enable row level security;
alter table public.business_members enable row level security;
alter table public.business_documents enable row level security;
alter table public.business_requests enable row level security;
alter table public.listing_reports enable row level security;
alter table public.job_reports enable row level security;
alter table public.event_reports enable row level security;
alter table public.identity_profiles enable row level security;

-- Helper: business owner check
create or replace function public.moxt_owns_business(bid text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.businesses b
    where b.id = bid and b.owner_id = (select auth.uid())
  );
$$;

-- Reviews policies
drop policy if exists "MOXT read reviews" on public.reviews;
create policy "MOXT read reviews" on public.reviews for select to authenticated using (true);
drop policy if exists "MOXT insert own reviews" on public.reviews;
create policy "MOXT insert own reviews" on public.reviews for insert to authenticated
  with check (author_id = (select auth.uid()));
drop policy if exists "MOXT update reviews" on public.reviews;
create policy "MOXT update reviews" on public.reviews for update to authenticated using (
  author_id = (select auth.uid())
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);

-- P2P policies
drop policy if exists "MOXT read p2p offers" on public.p2p_offers;
create policy "MOXT read p2p offers" on public.p2p_offers for select to authenticated using (true);
drop policy if exists "MOXT manage own p2p offers" on public.p2p_offers;
create policy "MOXT manage own p2p offers" on public.p2p_offers for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists "MOXT read own p2p orders" on public.p2p_orders;
create policy "MOXT read own p2p orders" on public.p2p_orders for select to authenticated using (
  buyer_id = (select auth.uid()) or seller_id = (select auth.uid())
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);
drop policy if exists "MOXT manage p2p orders" on public.p2p_orders;
create policy "MOXT manage p2p orders" on public.p2p_orders for all to authenticated using (
  buyer_id = (select auth.uid()) or seller_id = (select auth.uid())
) with check (
  buyer_id = (select auth.uid()) or seller_id = (select auth.uid())
);

-- Business members
drop policy if exists "MOXT manage business members" on public.business_members;
create policy "MOXT manage business members" on public.business_members for all to authenticated
  using (public.moxt_owns_business(business_id))
  with check (public.moxt_owns_business(business_id));

-- Business documents
drop policy if exists "MOXT manage business documents" on public.business_documents;
create policy "MOXT manage business documents" on public.business_documents for all to authenticated
  using (owner_id = (select auth.uid()) or public.moxt_owns_business(business_id))
  with check (owner_id = (select auth.uid()) or public.moxt_owns_business(business_id));

-- Business requests
drop policy if exists "MOXT read business requests" on public.business_requests;
create policy "MOXT read business requests" on public.business_requests for select to authenticated using (
  owner_id = (select auth.uid()) or public.moxt_owns_business(business_id)
);
drop policy if exists "MOXT insert business requests" on public.business_requests;
create policy "MOXT insert business requests" on public.business_requests for insert to authenticated
  with check (owner_id = (select auth.uid()));
drop policy if exists "MOXT update business requests" on public.business_requests;
create policy "MOXT update business requests" on public.business_requests for update to authenticated using (
  owner_id = (select auth.uid()) or public.moxt_owns_business(business_id)
);

-- Reports policies (reporter + admin)
drop policy if exists "MOXT read listing reports" on public.listing_reports;
create policy "MOXT read listing reports" on public.listing_reports for select to authenticated using (
  reporter_id = (select auth.uid())
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);
drop policy if exists "MOXT insert listing reports" on public.listing_reports;
create policy "MOXT insert listing reports" on public.listing_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));
drop policy if exists "MOXT update listing reports" on public.listing_reports;
create policy "MOXT update listing reports" on public.listing_reports for update to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);

drop policy if exists "MOXT read job reports" on public.job_reports;
create policy "MOXT read job reports" on public.job_reports for select to authenticated using (
  reporter_id = (select auth.uid())
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);
drop policy if exists "MOXT insert job reports" on public.job_reports;
create policy "MOXT insert job reports" on public.job_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));
drop policy if exists "MOXT update job reports" on public.job_reports;
create policy "MOXT update job reports" on public.job_reports for update to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);

drop policy if exists "MOXT read event reports" on public.event_reports;
create policy "MOXT read event reports" on public.event_reports for select to authenticated using (
  reporter_id = (select auth.uid())
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);
drop policy if exists "MOXT insert event reports" on public.event_reports;
create policy "MOXT insert event reports" on public.event_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()));
drop policy if exists "MOXT update event reports" on public.event_reports;
create policy "MOXT update event reports" on public.event_reports for update to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);

-- Identity profiles
drop policy if exists "MOXT manage own identity profiles" on public.identity_profiles;
create policy "MOXT manage own identity profiles" on public.identity_profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.reviews to authenticated;
grant select, insert, update, delete on public.p2p_offers to authenticated;
grant select, insert, update, delete on public.p2p_orders to authenticated;
grant select, insert, update, delete on public.business_members to authenticated;
grant select, insert, update, delete on public.business_documents to authenticated;
grant select, insert, update, delete on public.business_requests to authenticated;
grant select, insert, update, delete on public.listing_reports to authenticated;
grant select, insert, update, delete on public.job_reports to authenticated;
grant select, insert, update, delete on public.event_reports to authenticated;
grant select, insert, update, delete on public.identity_profiles to authenticated;

notify pgrst, 'reload schema';
