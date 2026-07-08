-- Admin profils, préférences compte, demandes de suppression

create or replace function public.moxt_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'superadmin')
  );
$$;

alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

create table if not exists public.account_deletion_requests (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'requested' check (status in ('requested', 'cancelled', 'processed')),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  processed_at timestamptz
);

create index if not exists account_deletion_requests_user_idx
  on public.account_deletion_requests (user_id, created_at desc);

alter table public.account_deletion_requests enable row level security;

drop policy if exists "MOXT admin read all profiles" on public.profiles;
create policy "MOXT admin read all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.moxt_is_admin());

drop policy if exists "MOXT admin update profiles" on public.profiles;
create policy "MOXT admin update profiles"
  on public.profiles
  for update
  to authenticated
  using (public.moxt_is_admin())
  with check (public.moxt_is_admin());

drop policy if exists "MOXT account deletion user manage" on public.account_deletion_requests;
create policy "MOXT account deletion user manage"
  on public.account_deletion_requests
  for all
  to authenticated
  using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);

drop policy if exists "MOXT account deletion admin read" on public.account_deletion_requests;
create policy "MOXT account deletion admin read"
  on public.account_deletion_requests
  for select
  to authenticated
  using (public.moxt_is_admin());

grant select, insert, update on public.account_deletion_requests to authenticated;

notify pgrst, 'reload schema';
