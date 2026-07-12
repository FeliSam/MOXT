-- Visibilité des publications entreprise (alignée sur les profils membres)
alter table public.businesses
  add column if not exists activity_visibility text not null default 'public'
    check (activity_visibility in ('private', 'contacts', 'public'));

-- Invités : uniquement les entreprises publiques validées
drop policy if exists "MOXT anon read verified businesses" on public.businesses;
create policy "MOXT anon read verified businesses"
on public.businesses
for select
to anon
using (
  status in ('verified', 'approved', 'active')
  and activity_visibility = 'public'
);

alter table public.profiles replica identity full;
alter table public.businesses replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'businesses'
  ) then
    alter publication supabase_realtime add table public.businesses;
  end if;
end $$;

notify pgrst, 'reload schema';
