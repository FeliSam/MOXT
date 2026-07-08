-- Profils : date d'inscription + lecture basique pour les pages publications

alter table public.profiles add column if not exists created_at timestamptz not null default now();

update public.profiles
set created_at = coalesce(created_at, updated_at, now())
where created_at is null;

drop policy if exists "MOXT read community profile basics" on public.profiles;
create policy "MOXT read community profile basics"
  on public.profiles
  for select
  to authenticated
  using (true);

notify pgrst, 'reload schema';
