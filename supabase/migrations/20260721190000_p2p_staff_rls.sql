-- Staff (admin / superadmin / moderator) : lecture + mise à jour des offres et commandes P2P

-- ── Offres : staff peut archiver / réactiver (UPDATE status) ─────────────────────
drop policy if exists "MOXT staff update p2p offers" on public.p2p_offers;
create policy "MOXT staff update p2p offers"
on public.p2p_offers
for update
to authenticated
using (public.moxt_is_moderator())
with check (public.moxt_is_moderator());

-- ── Commandes : staff lit toutes les commandes ───────────────────────────────
drop policy if exists "MOXT read own p2p orders" on public.p2p_orders;
create policy "MOXT read own p2p orders"
on public.p2p_orders
for select
to authenticated
using (
  buyer_id::text = (select auth.uid())::text
  or seller_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

-- ── Commandes : staff peut avancer / restaurer / annuler ─────────────────────
drop policy if exists "MOXT staff update p2p orders" on public.p2p_orders;
create policy "MOXT staff update p2p orders"
on public.p2p_orders
for update
to authenticated
using (public.moxt_is_moderator())
with check (public.moxt_is_moderator());

-- ── Preuves P2P : staff peut lire les fichiers du bucket ─────────────────────
drop policy if exists "MOXT staff read p2p proofs" on storage.objects;
create policy "MOXT staff read p2p proofs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'transfers'
  and (storage.foldername(name))[2] = 'p2p'
  and public.moxt_is_moderator()
);

notify pgrst, 'reload schema';
