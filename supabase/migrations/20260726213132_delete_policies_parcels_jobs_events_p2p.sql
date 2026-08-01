-- Ajoute les politiques DELETE manquantes pour colis / jobs / événements / offres P2P
-- (les annonces marketplace et les publications avaient déjà cette politique — cf.
-- 20260718150000_moderator_role.sql). Sans cela, l'action "Supprimer" ajoutée côté
-- client échouerait silencieusement : RLS activé + aucune politique = refus.

drop policy if exists "MOXT users can delete own parcels" on public.parcels;
create policy "MOXT users can delete own parcels"
on public.parcels
for delete
to authenticated
using (
  owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT users can delete own jobs" on public.jobs;
create policy "MOXT users can delete own jobs"
on public.jobs
for delete
to authenticated
using (
  owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT users can delete own events" on public.events;
create policy "MOXT users can delete own events"
on public.events
for delete
to authenticated
using (
  owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT users can delete own p2p offers" on public.p2p_offers;
create policy "MOXT users can delete own p2p offers"
on public.p2p_offers
for delete
to authenticated
using (
  owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);
