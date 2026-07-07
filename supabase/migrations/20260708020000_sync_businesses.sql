create table if not exists public.businesses (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'pending_review',
  primary_activity text not null default 'services',
  secondary_activity text not null default '',
  sector text not null default '',
  country text not null default 'RU',
  city text not null default 'Moscou',
  address text not null default '',
  phone text not null default '',
  origin_phone text not null default '',
  email text not null default '',
  telegram text not null default '',
  description text not null default '',
  website text not null default '',
  logo_url text not null default '',
  banner_url text not null default '',
  schedule_type text not null default 'weekdays',
  schedule_summary text not null default '',
  service_zones text not null default '',
  fee_percent numeric not null default 0,
  average_delay text not null default '',
  services jsonb not null default '[]'::jsonb,
  currencies jsonb not null default '[]'::jsonb,
  exchange_methods jsonb not null default '[]'::jsonb,
  transfer_accounts jsonb not null default '[]'::jsonb,
  schedule jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  rating numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists businesses_status_created_at_idx
on public.businesses (status, created_at desc);

create index if not exists businesses_owner_id_idx
on public.businesses (owner_id);

alter table public.businesses enable row level security;

drop policy if exists "MOXT users can view validated businesses" on public.businesses;
create policy "MOXT users can view validated businesses"
on public.businesses
for select
to authenticated
using (
  status in ('verified', 'approved', 'active')
  or owner_id::text = (select auth.uid())::text
  or exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin', 'superadmin')
  )
);

drop policy if exists "MOXT users can create own business" on public.businesses;
create policy "MOXT users can create own business"
on public.businesses
for insert
to authenticated
with check (owner_id::text = (select auth.uid())::text);

drop policy if exists "MOXT users can update own business" on public.businesses;
create policy "MOXT users can update own business"
on public.businesses
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

grant select, insert, update on table public.businesses to authenticated;

notify pgrst, 'reload schema';
