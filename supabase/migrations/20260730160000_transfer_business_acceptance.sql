-- Pré-acceptation échangeur.
-- Les métadonnées vivent aussi dans transfers.payload / businesses.payload
-- (compat si les colonnes dédiées ne sont pas encore visibles au cache PostgREST).

alter table public.businesses
  add column if not exists transfer_acceptance_required boolean not null default false;

comment on column public.businesses.transfer_acceptance_required is
  'Si true, un transfert doit être accepté par l''échangeur avant paiement client.';

alter table public.transfers
  add column if not exists acceptance_required boolean not null default false,
  add column if not exists acceptance_requested_at timestamptz,
  add column if not exists acceptance_expires_at timestamptz,
  add column if not exists acceptance_resolved_at timestamptz,
  add column if not exists previous_business_id text;

comment on column public.transfers.acceptance_required is
  'True si ce transfert a exigé une pré-acceptation échangeur.';
comment on column public.transfers.acceptance_expires_at is
  'Fin de la fenêtre d''acceptation (typiquement +10 min).';

create index if not exists transfers_acceptance_expires_idx
  on public.transfers (status, acceptance_expires_at)
  where status = 'pending_business_acceptance';

-- Autoriser le cycle pré-acceptation / refus / timeout / réassignation.
create or replace function public.moxt_enforce_transfer_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid text := (select auth.uid())::text;
  is_staff boolean := false;
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

    -- Réassignation : même transfert, nouvel échangeur (après refus ou timeout)
    if old.status in ('business_declined', 'pending_business_acceptance')
       and new.status in ('pending_business_acceptance', 'pending_payment')
       and (
         old.business_id is distinct from new.business_id
         or old.business_owner_id is distinct from new.business_owner_id
       ) then
      if uid is distinct from new.user_id::text then
        raise exception 'TRANSFER_ROLE: only the sender can reassign the exchanger';
      end if;
      return new;
    end if;

    -- Pré-acceptation : l'échangeur accepte → paiement client (même business)
    if old.status = 'pending_business_acceptance' and new.status = 'pending_payment' then
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
