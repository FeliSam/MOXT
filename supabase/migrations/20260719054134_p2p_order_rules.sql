-- Règles réelles pour les commandes P2P : séquencement des rôles (acheteur envoie
-- le paiement + preuve, vendeur confirme et finalise), verrouillage en cas de litige,
-- et accès en lecture/écriture au bucket privé 'transfers' pour les preuves P2P
-- (jusqu'ici seul le nom/taille du fichier était stocké, jamais le fichier lui-même).

-- ── Stockage : preuves de paiement P2P dans le bucket privé 'transfers' ─────────
-- Chemin : ${userId}/p2p/${orderId}/${filename}

drop policy if exists "MOXT users upload own p2p proofs" on storage.objects;
create policy "MOXT users upload own p2p proofs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'transfers'
  and (storage.foldername(name))[2] = 'p2p'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.p2p_orders o
    where o.id = (storage.foldername(name))[3]
      and (
        o.buyer_id::text = (select auth.uid())::text
        or o.seller_id::text = (select auth.uid())::text
      )
  )
);

drop policy if exists "MOXT read p2p proofs as participant" on storage.objects;
create policy "MOXT read p2p proofs as participant"
on storage.objects for select to authenticated
using (
  bucket_id = 'transfers'
  and (storage.foldername(name))[2] = 'p2p'
  and exists (
    select 1 from public.p2p_orders o
    where o.id = (storage.foldername(name))[3]
      and (
        o.buyer_id::text = (select auth.uid())::text
        or o.seller_id::text = (select auth.uid())::text
      )
  )
);

-- ── Séquencement des statuts de commande P2P (trigger, appliqué quel que soit
--    le point d'entrée client) ──────────────────────────────────────────────
create or replace function public.moxt_p2p_order_guard_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  is_staff boolean;
begin
  if new.status is distinct from old.status then
    is_staff := exists (
      select 1 from public.profiles p
      where p.id = actor and p.role in ('admin', 'superadmin', 'moderator')
    );

    if not is_staff then
      if old.status in ('completed', 'cancelled') then
        raise exception 'Cette commande P2P est déjà finalisée (%).', old.status;
      end if;

      if new.status = 'waiting_payment' then
        if old.status <> 'created' then
          raise exception 'Transition invalide vers waiting_payment depuis %.', old.status;
        end if;
        if actor <> old.buyer_id then
          raise exception 'Seul l''acheteur peut signaler l''envoi du paiement.';
        end if;
        if not exists (
          select 1 from jsonb_array_elements(coalesce(new.proofs, '[]'::jsonb)) p
          where (p->>'userId') = actor::text
        ) then
          raise exception 'Ajoutez une preuve de paiement avant de continuer.';
        end if;

      elsif new.status = 'completed' then
        if old.status <> 'waiting_payment' then
          raise exception 'Transition invalide vers completed depuis %.', old.status;
        end if;
        if actor <> old.seller_id then
          raise exception 'Seul le vendeur peut confirmer la réception et finaliser.';
        end if;

      elsif new.status = 'cancelled' then
        if old.status <> 'created' then
          raise exception 'L''annulation n''est possible qu''avant l''envoi du paiement.';
        end if;
        if actor <> old.buyer_id and actor <> old.seller_id then
          raise exception 'Seules les parties de la commande peuvent l''annuler.';
        end if;

      elsif new.status = 'disputed' then
        if actor <> old.buyer_id and actor <> old.seller_id then
          raise exception 'Seules les parties de la commande peuvent ouvrir un litige.';
        end if;

      else
        raise exception 'Statut de commande inconnu : %.', new.status;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists moxt_p2p_order_guard_transition on public.p2p_orders;
create trigger moxt_p2p_order_guard_transition
before update on public.p2p_orders
for each row execute function public.moxt_p2p_order_guard_transition();

notify pgrst, 'reload schema';
