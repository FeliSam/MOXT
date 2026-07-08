-- Modération des abonnés : retrait, bannissement, signalement

create table if not exists public.publisher_subscriber_bans (
  id text primary key,
  publisher_type text not null check (publisher_type in ('user', 'business')),
  publisher_id text not null,
  subscriber_id uuid not null references auth.users (id) on delete cascade,
  reason text not null default '',
  banned_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  unique (publisher_type, publisher_id, subscriber_id)
);

create index if not exists publisher_subscriber_bans_publisher_idx
  on public.publisher_subscriber_bans (publisher_type, publisher_id, created_at desc);

create index if not exists publisher_subscriber_bans_subscriber_idx
  on public.publisher_subscriber_bans (subscriber_id, created_at desc);

create table if not exists public.subscriber_reports (
  id text primary key,
  publisher_type text not null check (publisher_type in ('user', 'business')),
  publisher_id text not null,
  subscriber_id uuid not null references auth.users (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null default '',
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists subscriber_reports_publisher_idx
  on public.subscriber_reports (publisher_type, publisher_id, created_at desc);

create index if not exists subscriber_reports_status_idx
  on public.subscriber_reports (status, created_at desc);

alter table public.publisher_subscriber_bans enable row level security;
alter table public.subscriber_reports enable row level security;

-- L'éditeur peut retirer un abonné
drop policy if exists "MOXT publisher subscriptions publisher delete" on public.publisher_subscriptions;
create policy "MOXT publisher subscriptions publisher delete"
  on public.publisher_subscriptions
  for delete
  to authenticated
  using (
    (publisher_type = 'user' and publisher_id = auth.uid()::text)
    or (
      publisher_type = 'business'
      and public.moxt_owns_business(publisher_id)
    )
  );

-- Bannissements
drop policy if exists "MOXT publisher bans publisher manage" on public.publisher_subscriber_bans;
create policy "MOXT publisher bans publisher manage"
  on public.publisher_subscriber_bans
  for all
  to authenticated
  using (
    (publisher_type = 'user' and publisher_id = auth.uid()::text)
    or (publisher_type = 'business' and public.moxt_owns_business(publisher_id))
  )
  with check (
    (publisher_type = 'user' and publisher_id = auth.uid()::text)
    or (publisher_type = 'business' and public.moxt_owns_business(publisher_id))
  );

drop policy if exists "MOXT publisher bans subscriber read" on public.publisher_subscriber_bans;
create policy "MOXT publisher bans subscriber read"
  on public.publisher_subscriber_bans
  for select
  to authenticated
  using (subscriber_id::text = auth.uid()::text);

-- Signalements abonnés
drop policy if exists "MOXT subscriber reports publisher insert" on public.subscriber_reports;
create policy "MOXT subscriber reports publisher insert"
  on public.subscriber_reports
  for insert
  to authenticated
  with check (
    reporter_id::text = auth.uid()::text
    and (
      (publisher_type = 'user' and publisher_id = auth.uid()::text)
      or (publisher_type = 'business' and public.moxt_owns_business(publisher_id))
    )
  );

drop policy if exists "MOXT subscriber reports read" on public.subscriber_reports;
create policy "MOXT subscriber reports read"
  on public.subscriber_reports
  for select
  to authenticated
  using (
    reporter_id::text = auth.uid()::text
    or (
      (publisher_type = 'user' and publisher_id = auth.uid()::text)
      or (publisher_type = 'business' and public.moxt_owns_business(publisher_id))
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "MOXT subscriber reports admin update" on public.subscriber_reports;
create policy "MOXT subscriber reports admin update"
  on public.subscriber_reports
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'superadmin')
    )
  );

grant select, insert, update, delete on public.publisher_subscriber_bans to authenticated;
grant select, insert, update on public.subscriber_reports to authenticated;

notify pgrst, 'reload schema';
