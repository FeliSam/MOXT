-- Finance : paiements et mouvements portefeuille

create table if not exists public.payments (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  related_type text not null default '',
  related_id text not null default '',
  amount numeric not null default 0,
  currency text not null default 'RUB',
  provider text not null default 'MOXT',
  status text not null default 'pending',
  simulation boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.wallet_entries (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  direction text not null default 'out',
  amount numeric not null default 0,
  currency text not null default 'RUB',
  label text not null default '',
  related_type text not null default '',
  related_id text not null default '',
  simulation boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  related_type text not null default '',
  related_id text not null default '',
  title text not null default '',
  amount numeric not null default 0,
  currency text not null default 'RUB',
  status text not null default 'issued',
  details jsonb not null default '{}'::jsonb,
  simulation boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists payments_user_created_idx
on public.payments (user_id, created_at desc);

create index if not exists wallet_entries_user_created_idx
on public.wallet_entries (user_id, created_at desc);

create index if not exists receipts_user_created_idx
on public.receipts (user_id, created_at desc);

alter table public.payments enable row level security;
alter table public.wallet_entries enable row level security;
alter table public.receipts enable row level security;

-- Legacy tables may have been created with text user_id columns
do $$
declare
  tbl text;
begin
  foreach tbl in array array['payments', 'wallet_entries', 'receipts'] loop
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

drop policy if exists "MOXT users manage own payments" on public.payments;
create policy "MOXT users manage own payments"
on public.payments for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "MOXT users manage own wallet entries" on public.wallet_entries;
create policy "MOXT users manage own wallet entries"
on public.wallet_entries for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "MOXT users manage own receipts" on public.receipts;
create policy "MOXT users manage own receipts"
on public.receipts for all
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.payments to authenticated;
grant select, insert, update, delete on public.wallet_entries to authenticated;
grant select, insert, update, delete on public.receipts to authenticated;

notify pgrst, 'reload schema';
