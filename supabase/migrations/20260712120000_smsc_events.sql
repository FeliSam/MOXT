-- Événements SMSC : SMS entrants (MO) et accusés de livraison (statuts).

create table if not exists public.smsc_events (
  smsc_id text primary key,
  event_type text not null check (event_type in ('incoming', 'status')),
  from_phone text not null default '',
  to_phone text not null default '',
  message text not null default '',
  delivery_status text not null default '',
  event_time timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists smsc_events_type_created_idx
  on public.smsc_events (event_type, created_at desc);

create index if not exists smsc_events_from_phone_idx
  on public.smsc_events (from_phone, created_at desc);

alter table public.smsc_events enable row level security;

drop policy if exists "MOXT admins read smsc events" on public.smsc_events;
create policy "MOXT admins read smsc events"
  on public.smsc_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role in ('admin', 'superadmin')
    )
  );

grant select on table public.smsc_events to authenticated;

notify pgrst, 'reload schema';
