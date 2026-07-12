-- Aperçu public (scan QR / lien partagé) sans compte MOXT

-- Profils publics : champs limités pour anon + membres connectés
drop policy if exists "MOXT anon read public profiles" on public.profiles;
create policy "MOXT anon read public profiles"
on public.profiles
for select
to anon
using (activity_visibility = 'public');

drop policy if exists "MOXT authenticated read public profiles" on public.profiles;
create policy "MOXT authenticated read public profiles"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
  or activity_visibility = 'public'
  or (select private.shares_conversation_with(profiles.id))
);

grant select on table public.profiles to anon;

-- Entreprises validées
drop policy if exists "MOXT anon read verified businesses" on public.businesses;
create policy "MOXT anon read verified businesses"
on public.businesses
for select
to anon
using (status in ('verified', 'approved', 'active'));

grant select on table public.businesses to anon;

-- Catalogue public actif
drop policy if exists "MOXT anon read active listings" on public.listings;
create policy "MOXT anon read active listings"
on public.listings
for select
to anon
using (status = 'active');

drop policy if exists "MOXT anon read active parcels" on public.parcels;
create policy "MOXT anon read active parcels"
on public.parcels
for select
to anon
using (status in ('active', 'full'));

drop policy if exists "MOXT anon read active jobs" on public.jobs;
create policy "MOXT anon read active jobs"
on public.jobs
for select
to anon
using (status = 'active');

drop policy if exists "MOXT anon read published events" on public.events;
create policy "MOXT anon read published events"
on public.events
for select
to anon
using (status = 'published');

drop policy if exists "MOXT anon read published posts" on public.posts;
create policy "MOXT anon read published posts"
on public.posts
for select
to anon
using (status = 'published');

drop policy if exists "MOXT anon read published reviews" on public.reviews;
create policy "MOXT anon read published reviews"
on public.reviews
for select
to anon
using (status = 'published');

grant select on table public.listings to anon;
grant select on table public.parcels to anon;
grant select on table public.jobs to anon;
grant select on table public.events to anon;
grant select on table public.posts to anon;
grant select on table public.reviews to anon;

notify pgrst, 'reload schema';
