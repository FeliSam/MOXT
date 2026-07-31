-- Exige une preuve du vendeur (initiateur de l'offre) avant de finaliser en completed.

create or replace function public.moxt_p2p_order_guard_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor text := (select auth.uid())::text;
  is_staff boolean;
begin
  if new.status is distinct from old.status then
    is_staff := exists (
      select 1 from public.profiles p
      where p.id::text = actor and p.role in ('admin', 'superadmin', 'moderator')
    );

    if not is_staff then
      if old.status in ('completed', 'cancelled') then
        raise exception 'Cette commande P2P est déjà finalisée (%).', old.status;
      end if;

      if new.status = 'waiting_payment' then
        if old.status <> 'created' then
          raise exception 'Transition invalide vers waiting_payment depuis %.', old.status;
        end if;
        if actor is distinct from old.buyer_id::text then
          raise exception 'Seul l''acheteur peut signaler l''envoi du paiement.';
        end if;
        if not exists (
          select 1 from jsonb_array_elements(coalesce(new.proofs, '[]'::jsonb)) p
          where (p->>'userId') = actor
        ) then
          raise exception 'Ajoutez une preuve de paiement avant de continuer.';
        end if;

      elsif new.status = 'completed' then
        if old.status <> 'waiting_payment' then
          raise exception 'Transition invalide vers completed depuis %.', old.status;
        end if;
        if actor is distinct from old.seller_id::text then
          raise exception 'Seul le vendeur peut confirmer la réception et finaliser.';
        end if;
        if not exists (
          select 1 from jsonb_array_elements(coalesce(new.proofs, '[]'::jsonb)) p
          where (p->>'userId') = old.seller_id::text
        ) then
          raise exception 'Ajoutez une preuve de transfert avant de finaliser la transaction.';
        end if;

      elsif new.status = 'cancelled' then
        if old.status <> 'created' then
          raise exception 'L''annulation n''est possible qu''avant l''envoi du paiement.';
        end if;
        if actor is distinct from old.buyer_id::text
           and actor is distinct from old.seller_id::text then
          raise exception 'Seules les parties de la commande peuvent l''annuler.';
        end if;

      elsif new.status = 'disputed' then
        if actor is distinct from old.buyer_id::text
           and actor is distinct from old.seller_id::text then
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

notify pgrst, 'reload schema';
