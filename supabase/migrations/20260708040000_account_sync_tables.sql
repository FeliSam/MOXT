-- Compte : documents, vérification, profils transfert, adresses, support, visibilité activité

alter table public.profiles
  add column if not exists activity_visibility text not null default 'private'
    check (activity_visibility in ('private', 'contacts', 'public'));

create table if not exists public.personal_documents (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null default 'identity',
  name text not null default '',
  size integer not null default 0,
  type text not null default 'application/octet-stream',
  url text,
  status text not null default 'pending_review',
  created_at timestamptz not null default now()
);

create table if not exists public.verification_requests (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  level text not null default 'identity',
  document_ids jsonb not null default '[]'::jsonb,
  note text not null default '',
  status text not null default 'pending_review',
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table if not exists public.transfer_profiles (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  country text not null default 'RU',
  method text not null default 'mobile_money',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipient_addresses (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  owner_type text not null default 'PERSON',
  label text not null default '',
  country text not null default '',
  city text not null default '',
  address_line text not null default '',
  phone text not null default '',
  email text not null default '',
  identity jsonb not null default '{}'::jsonb,
  identity_profile_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  user_name text not null default '',
  subject text not null default '',
  priority text not null default 'normal',
  category text not null default 'other',
  status text not null default 'waiting_agent',
  messages jsonb not null default '[]'::jsonb,
  assigned_to uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.personal_documents enable row level security;
alter table public.verification_requests enable row level security;
alter table public.transfer_profiles enable row level security;
alter table public.recipient_addresses enable row level security;
alter table public.support_tickets enable row level security;

-- Legacy tables may have been created with text user_id columns
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'personal_documents',
    'verification_requests',
    'transfer_profiles',
    'recipient_addresses',
    'support_tickets'
  ] loop
    if exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = tbl
        and c.column_name = 'user_id'
        and c.data_type = 'text'
    ) then
      execute format(
        'alter table public.%I alter column user_id type uuid using user_id::uuid',
        tbl
      );
    end if;
  end loop;
end $$;

-- personal_documents
drop policy if exists "MOXT users manage own documents" on public.personal_documents;
create policy "MOXT users manage own documents"
on public.personal_documents for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- verification_requests
drop policy if exists "MOXT users manage own verification" on public.verification_requests;
create policy "MOXT users manage own verification"
on public.verification_requests for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "MOXT admins read verification" on public.verification_requests;
create policy "MOXT admins read verification"
on public.verification_requests for select
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin', 'superadmin')
  )
);

drop policy if exists "MOXT admins update verification" on public.verification_requests;
create policy "MOXT admins update verification"
on public.verification_requests for update
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin', 'superadmin')
  )
);

-- transfer_profiles
drop policy if exists "MOXT users manage own transfer profiles" on public.transfer_profiles;
create policy "MOXT users manage own transfer profiles"
on public.transfer_profiles for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- recipient_addresses
drop policy if exists "MOXT users manage own recipient addresses" on public.recipient_addresses;
create policy "MOXT users manage own recipient addresses"
on public.recipient_addresses for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- support_tickets
drop policy if exists "MOXT users manage own support tickets" on public.support_tickets;
create policy "MOXT users manage own support tickets"
on public.support_tickets for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "MOXT admins read support tickets" on public.support_tickets;
create policy "MOXT admins read support tickets"
on public.support_tickets for select
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin', 'superadmin')
  )
);

drop policy if exists "MOXT admins update support tickets" on public.support_tickets;
create policy "MOXT admins update support tickets"
on public.support_tickets for update
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin', 'superadmin')
  )
);

grant select, insert, update, delete on public.personal_documents to authenticated;
grant select, insert, update, delete on public.verification_requests to authenticated;
grant select, insert, update, delete on public.transfer_profiles to authenticated;
grant select, insert, update, delete on public.recipient_addresses to authenticated;
grant select, insert, update, delete on public.support_tickets to authenticated;
