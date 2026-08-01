-- Autoriser la réassignation client après refus / timeout.
-- Distingue acceptation (même business) vs réassignation (business_id change).

create or replace function public.moxt_enforce_transfer_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid text := (select auth.uid())::text;
  is_staff boolean := false;
  business_changed boolean := false;
begin
  if uid is null or uid = '' then
    return new;
  end if;

  is_staff := public.moxt_is_staff_user(auth.uid());

  if tg_op = 'INSERT' then
    if new.user_id::text = uid
       and new.business_owner_id is not distinct from new.user_id
       and not is_staff then
      raise exception 'TRANSFER_SELF_BUSINESS: cannot create a transfer to your own business';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    if is_staff then
      return new;
    end if;

    business_changed :=
      old.business_id is distinct from new.business_id
      or old.business_owner_id is distinct from new.business_owner_id;

    -- Réassignation : même transfert, nouvel échangeur (après refus ou timeout)
    if old.status in ('business_declined', 'pending_business_acceptance')
       and new.status in ('pending_business_acceptance', 'pending_payment')
       and business_changed then
      if uid is distinct from new.user_id::text then
        raise exception 'TRANSFER_ROLE: only the sender can reassign the exchanger';
      end if;
      return new;
    end if;

    -- Pré-acceptation : l'échangeur accepte → paiement client (même business)
    if old.status = 'pending_business_acceptance'
       and new.status = 'pending_payment'
       and not business_changed then
      if uid is distinct from new.business_owner_id::text or uid = new.user_id::text then
        raise exception 'TRANSFER_ROLE: only the partner business can accept the transfer request';
      end if;
      return new;
    end if;

    -- Pré-acceptation : refus explicite ou timeout synchronisé
    if old.status = 'pending_business_acceptance' and new.status = 'business_declined' then
      if uid = new.user_id::text
         and uid is distinct from coalesce(new.business_owner_id::text, '') then
        -- timeout côté client autorisé
        return new;
      end if;
      if uid is distinct from new.business_owner_id::text or uid = new.user_id::text then
        raise exception 'TRANSFER_ROLE: only the partner business can decline the transfer request';
      end if;
      return new;
    end if;

    -- Annulation aussi pendant attente / refus
    if old.status in (
         'pending_payment',
         'payment_declared',
         'pending_business_acceptance',
         'business_declined'
       )
       and new.status = 'cancelled' then
      if uid is distinct from new.user_id::text then
        raise exception 'TRANSFER_ROLE: only the sender can cancel';
      end if;
      return new;
    end if;

    -- Sender actions
    if old.status = 'pending_payment' and new.status = 'payment_declared' then
      if uid is distinct from new.user_id::text then
        raise exception 'TRANSFER_ROLE: only the sender can declare payment';
      end if;
      return new;
    end if;

    if old.status = 'paid_out' and new.status = 'completed' then
      if uid is distinct from new.user_id::text then
        raise exception 'TRANSFER_ROLE: only the sender can declare reception / complete';
      end if;
      return new;
    end if;

    if old.status = 'pending_payment' and new.status = 'expired' then
      return new;
    end if;

    -- Business actions — never the same person as the sender
    if old.status = 'payment_declared' and new.status = 'payment_received' then
      if uid is distinct from new.business_owner_id::text or uid = new.user_id::text then
        raise exception 'TRANSFER_ROLE: only the partner business can confirm payment reception';
      end if;
      return new;
    end if;

    if old.status in ('payment_received', 'processing') and new.status = 'paid_out' then
      if uid is distinct from new.business_owner_id::text or uid = new.user_id::text then
        raise exception 'TRANSFER_ROLE: only the partner business can confirm payout';
      end if;
      return new;
    end if;

    raise exception 'TRANSFER_TRANSITION: invalid status change from % to %', old.status, new.status;
  end if;

  return new;
end;
$$;

notify pgrst, 'reload schema';
