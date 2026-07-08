-- Catalogue communautaire + compte : tables manquantes pour sync Redux ↔ Supabase

-- ── Favoris ───────────────────────────────────────────────────────────────────
create table if not exists public.favorites (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  related_type text not null default '',
  related_id text not null default '',
  title text not null default '',
  path text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists favorites_user_related_uidx
  on public.favorites (user_id, related_type, related_id);

-- ── Notifications ───────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  message text not null default '',
  type text not null default 'system',
  link text,
  priority text not null default 'normal' check (priority in ('high', 'normal', 'low')),
  read boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- ── Colis ─────────────────────────────────────────────────────────────────────
create table if not exists public.parcels (
  id text primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  owner_name text not null default '',
  business_id text,
  from_country text not null default '',
  to_country text not null default '',
  origin text not null default '',
  destination text not null default '',
  origin_airport_code text not null default '',
  destination_airport_code text not null default '',
  departure_date text,
  deposit_deadline text,
  capacity_kg numeric not null default 0,
  remaining_kg numeric not null default 0,
  price_per_kg numeric not null default 0,
  currency text not null default 'RUB',
  max_weight_per_item numeric,
  accepted_types jsonb not null default '[]'::jsonb,
  rejected_types text not null default '',
  conditions text not null default '',
  contact text not null default '',
  publish_as text not null default 'person',
  travel_proof_url text,
  proof_status text not null default 'pending_review',
  proof_notes text not null default '',
  status text not null default 'active',
  reservations jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parcel_requests (
  id text primary key,
  parcel_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  requester_name text not null default '',
  owner_id uuid not null references auth.users (id) on delete cascade,
  business_id text,
  related_type text not null default 'parcel',
  related_id text not null default '',
  kg numeric not null default 0,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists parcels_status_created_idx on public.parcels (status, created_at desc);
create index if not exists parcels_owner_idx on public.parcels (owner_id);
create index if not exists parcel_requests_parcel_idx on public.parcel_requests (parcel_id);
create index if not exists parcel_requests_user_idx on public.parcel_requests (user_id);

-- ── Jobs ──────────────────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id text primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  publisher_name text not null default '',
  business_id text,
  title text not null default '',
  sector text not null default '',
  contract_type text not null default '',
  experience_level text not null default '',
  language text not null default '',
  salary text not null default '',
  salary_period text not null default '',
  description text not null default '',
  requirements text not null default '',
  benefits text not null default '',
  location text not null default '',
  remote boolean not null default false,
  start_date text,
  application_deadline text,
  publisher_type text not null default 'personal',
  status text not null default 'active',
  expires_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_applications (
  id text primary key,
  job_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  applicant_name text not null default '',
  message text not null default '',
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_status_created_idx on public.jobs (status, created_at desc);
create index if not exists jobs_owner_idx on public.jobs (owner_id);
create index if not exists job_applications_job_idx on public.job_applications (job_id);
create index if not exists job_applications_user_idx on public.job_applications (user_id);

-- ── Événements ────────────────────────────────────────────────────────────────
create table if not exists public.events (
  id text primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  business_id text,
  title text not null default '',
  category text not null default '',
  format text not null default 'in_person',
  language text not null default '',
  description text not null default '',
  program text not null default '',
  speakers text not null default '',
  start_at timestamptz,
  end_at timestamptz,
  registration_deadline text,
  city text not null default '',
  venue text not null default '',
  address text not null default '',
  online_link text not null default '',
  capacity numeric not null default 0,
  price numeric not null default 0,
  currency text not null default 'RUB',
  free_entry boolean not null default false,
  organizer_name text not null default '',
  organizer_contact text not null default '',
  status text not null default 'published',
  expires_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id text primary key,
  event_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  participant_name text not null default '',
  status text not null default 'registered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_status_created_idx on public.events (status, created_at desc);
create index if not exists events_owner_idx on public.events (owner_id);
create index if not exists event_registrations_event_idx on public.event_registrations (event_id);
create index if not exists event_registrations_user_idx on public.event_registrations (user_id);

-- ── Publications fil ──────────────────────────────────────────────────────────
create table if not exists public.posts (
  id text primary key,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default '',
  author_avatar_url text,
  source_type text not null default 'free',
  source_id text,
  message text not null default '',
  image_url text,
  direct_link text,
  likes jsonb not null default '[]'::jsonb,
  comments jsonb not null default '[]'::jsonb,
  last_shared_at timestamptz,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_created_idx on public.posts (status, created_at desc);
create index if not exists posts_author_idx on public.posts (author_id);

-- ── Transferts ────────────────────────────────────────────────────────────────
create table if not exists public.transfers (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  origin_country text not null default '',
  business_id text,
  business_owner_id uuid references auth.users (id),
  status text not null default 'pending',
  direction text not null default '',
  amount numeric not null default 0,
  fee numeric not null default 0,
  received_amount numeric not null default 0,
  rate numeric not null default 0,
  rate_date timestamptz,
  rate_source text not null default 'fallback',
  sender jsonb not null default '{}'::jsonb,
  recipient jsonb not null default '{}'::jsonb,
  exchanger jsonb not null default '{}'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  payment_proof jsonb,
  business_proof jsonb,
  received_method text,
  received_proof jsonb,
  received_at timestamptz,
  payment_deadline_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transfers_user_created_idx on public.transfers (user_id, created_at desc);
create index if not exists transfers_business_owner_idx on public.transfers (business_owner_id);

-- ── Litiges ───────────────────────────────────────────────────────────────────
create table if not exists public.disputes (
  id text primary key,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  target_id uuid references auth.users (id),
  business_id text,
  related_type text not null default '',
  related_id text not null default '',
  reason text not null default '',
  evidence jsonb not null default '[]'::jsonb,
  status text not null default 'new',
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Colonnes manquantes sur tables legacy (idempotent)
alter table public.favorites add column if not exists user_id uuid references auth.users (id) on delete cascade;
alter table public.notifications add column if not exists priority text not null default 'normal';
alter table public.notifications add column if not exists archived boolean not null default false;
alter table public.disputes add column if not exists reporter_id uuid references auth.users (id) on delete cascade;
alter table public.disputes add column if not exists target_id uuid references auth.users (id);
alter table public.disputes add column if not exists updated_by uuid references auth.users (id);

create index if not exists disputes_reporter_idx on public.disputes (reporter_id);
create index if not exists disputes_target_idx on public.disputes (target_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;
alter table public.parcels enable row level security;
alter table public.parcel_requests enable row level security;
alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.posts enable row level security;
alter table public.transfers enable row level security;
alter table public.disputes enable row level security;

-- Favoris
drop policy if exists "MOXT users manage own favorites" on public.favorites;
create policy "MOXT users manage own favorites" on public.favorites for all to authenticated
  using (user_id::text = (select auth.uid())::text) with check (user_id::text = (select auth.uid())::text);

-- Notifications
drop policy if exists "MOXT users manage own notifications" on public.notifications;
create policy "MOXT users manage own notifications" on public.notifications for all to authenticated
  using (user_id::text = (select auth.uid())::text) with check (user_id::text = (select auth.uid())::text);

-- Parcels catalog
drop policy if exists "MOXT read parcels" on public.parcels;
create policy "MOXT read parcels" on public.parcels for select to authenticated using (
  status in ('active', 'full')
  or owner_id::text = (select auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);
drop policy if exists "MOXT manage own parcels" on public.parcels;
create policy "MOXT manage own parcels" on public.parcels for insert to authenticated
  with check (owner_id::text = (select auth.uid())::text);
drop policy if exists "MOXT update own parcels" on public.parcels;
create policy "MOXT update own parcels" on public.parcels for update to authenticated
  using (owner_id::text = (select auth.uid())::text or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin')));

-- Parcel requests
drop policy if exists "MOXT read parcel requests" on public.parcel_requests;
create policy "MOXT read parcel requests" on public.parcel_requests for select to authenticated using (
  user_id::text = (select auth.uid())::text
  or owner_id::text = (select auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);
drop policy if exists "MOXT insert parcel requests" on public.parcel_requests;
create policy "MOXT insert parcel requests" on public.parcel_requests for insert to authenticated
  with check (user_id::text = (select auth.uid())::text);
drop policy if exists "MOXT update parcel requests" on public.parcel_requests;
create policy "MOXT update parcel requests" on public.parcel_requests for update to authenticated using (
  user_id::text = (select auth.uid())::text or owner_id::text = (select auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);

-- Jobs
drop policy if exists "MOXT read jobs" on public.jobs;
create policy "MOXT read jobs" on public.jobs for select to authenticated using (
  status = 'active'
  or owner_id::text = (select auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);
drop policy if exists "MOXT manage own jobs" on public.jobs;
create policy "MOXT manage own jobs" on public.jobs for all to authenticated
  using (owner_id::text = (select auth.uid())::text or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin')))
  with check (owner_id::text = (select auth.uid())::text);

-- Job applications
drop policy if exists "MOXT read job applications" on public.job_applications;
create policy "MOXT read job applications" on public.job_applications for select to authenticated using (
  user_id::text = (select auth.uid())::text
  or exists (select 1 from public.jobs j where j.id = job_id and j.owner_id::text = (select auth.uid())::text)
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);
drop policy if exists "MOXT insert job applications" on public.job_applications;
create policy "MOXT insert job applications" on public.job_applications for insert to authenticated
  with check (user_id::text = (select auth.uid())::text);
drop policy if exists "MOXT update job applications" on public.job_applications;
create policy "MOXT update job applications" on public.job_applications for update to authenticated using (
  user_id::text = (select auth.uid())::text
  or exists (select 1 from public.jobs j where j.id = job_id and j.owner_id::text = (select auth.uid())::text)
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);

-- Events
drop policy if exists "MOXT read events" on public.events;
create policy "MOXT read events" on public.events for select to authenticated using (
  status = 'published'
  or owner_id::text = (select auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);
drop policy if exists "MOXT manage own events" on public.events;
create policy "MOXT manage own events" on public.events for all to authenticated
  using (owner_id::text = (select auth.uid())::text or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin')))
  with check (owner_id::text = (select auth.uid())::text);

-- Event registrations
drop policy if exists "MOXT read event registrations" on public.event_registrations;
create policy "MOXT read event registrations" on public.event_registrations for select to authenticated using (
  user_id::text = (select auth.uid())::text
  or exists (select 1 from public.events e where e.id = event_id and e.owner_id::text = (select auth.uid())::text)
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);
drop policy if exists "MOXT insert event registrations" on public.event_registrations;
create policy "MOXT insert event registrations" on public.event_registrations for insert to authenticated
  with check (user_id::text = (select auth.uid())::text);
drop policy if exists "MOXT update event registrations" on public.event_registrations;
create policy "MOXT update event registrations" on public.event_registrations for update to authenticated using (
  user_id::text = (select auth.uid())::text
  or exists (select 1 from public.events e where e.id = event_id and e.owner_id::text = (select auth.uid())::text)
);

-- Posts
drop policy if exists "MOXT read posts" on public.posts;
create policy "MOXT read posts" on public.posts for select to authenticated using (
  status = 'published'
  or author_id::text = (select auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);
drop policy if exists "MOXT manage own posts" on public.posts;
create policy "MOXT manage own posts" on public.posts for all to authenticated
  using (author_id::text = (select auth.uid())::text or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin')))
  with check (author_id::text = (select auth.uid())::text);

-- Transfers
drop policy if exists "MOXT read transfers" on public.transfers;
create policy "MOXT read transfers" on public.transfers for select to authenticated using (
  user_id::text = (select auth.uid())::text
  or business_owner_id::text = (select auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);
drop policy if exists "MOXT insert transfers" on public.transfers;
create policy "MOXT insert transfers" on public.transfers for insert to authenticated
  with check (user_id::text = (select auth.uid())::text);
drop policy if exists "MOXT update transfers" on public.transfers;
create policy "MOXT update transfers" on public.transfers for update to authenticated using (
  user_id::text = (select auth.uid())::text
  or business_owner_id::text = (select auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);

-- Disputes
drop policy if exists "MOXT read disputes" on public.disputes;
create policy "MOXT read disputes" on public.disputes for select to authenticated using (
  reporter_id::text = (select auth.uid())::text
  or target_id::text = (select auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);
drop policy if exists "MOXT insert disputes" on public.disputes;
create policy "MOXT insert disputes" on public.disputes for insert to authenticated
  with check (reporter_id::text = (select auth.uid())::text);
drop policy if exists "MOXT update disputes" on public.disputes;
create policy "MOXT update disputes" on public.disputes for update to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
  or reporter_id::text = (select auth.uid())::text
  or target_id::text = (select auth.uid())::text
);

grant select, insert, update, delete on public.favorites to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.parcels to authenticated;
grant select, insert, update, delete on public.parcel_requests to authenticated;
grant select, insert, update, delete on public.jobs to authenticated;
grant select, insert, update, delete on public.job_applications to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.event_registrations to authenticated;
grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, update, delete on public.transfers to authenticated;
grant select, insert, update, delete on public.disputes to authenticated;

notify pgrst, 'reload schema';
