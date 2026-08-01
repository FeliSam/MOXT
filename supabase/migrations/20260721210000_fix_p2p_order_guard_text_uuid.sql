-- Fix: operator does not exist: uuid <> text
-- moxt_p2p_order_guard_transition compared auth.uid() (uuid) to buyer_id/seller_id
-- without ::text. Align with other MOXT policies / transfer role fix.

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

-- Harden sync RPC the same way (profiles.id / buyer / seller may differ by env).
create or replace function public.moxt_sync_p2p_order(p_order jsonb, p_offer jsonb default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := (select auth.uid())::text;
  v_offer_id text := coalesce(p_order->>'offer_id', p_order->>'offerId');
  v_buyer text := nullif(coalesce(p_order->>'buyer_id', p_order->>'buyerId'), '');
  v_seller text := nullif(coalesce(p_order->>'seller_id', p_order->>'sellerId'), '');
  v_owner text;
  v_is_staff boolean;
  v_offer_row jsonb := p_offer;
begin
  if v_uid is null or v_uid = '' then
    raise exception 'Authentification requise';
  end if;

  if v_offer_id is null or length(trim(v_offer_id)) = 0 then
    raise exception 'offer_id manquant sur la commande P2P';
  end if;

  v_is_staff := exists (
    select 1 from public.profiles p
    where p.id::text = v_uid and p.role in ('admin', 'superadmin', 'moderator')
  );

  if not v_is_staff
     and v_uid is distinct from v_buyer
     and v_uid is distinct from v_seller then
    raise exception 'Accès refusé à cette commande P2P';
  end if;

  if not exists (select 1 from public.p2p_offers where id = v_offer_id) then
    if v_offer_row is null then
      raise exception
        'Offre P2P introuvable (%). Le vendeur doit republier l''offre, puis réessayez.',
        v_offer_id;
    end if;

    v_owner := nullif(coalesce(v_offer_row->>'owner_id', v_offer_row->>'ownerId'), '');
    if v_owner is null then
      v_owner := v_seller;
    end if;
    if v_owner is null then
      raise exception 'owner_id manquant pour créer l''offre P2P (%)', v_offer_id;
    end if;

    insert into public.p2p_offers (
      id,
      owner_id,
      owner_name,
      amount,
      from_currency,
      to_currency,
      rate,
      status,
      payload,
      created_at
    ) values (
      coalesce(v_offer_row->>'id', v_offer_id),
      v_owner::uuid,
      coalesce(v_offer_row->>'owner_name', v_offer_row->>'ownerName', ''),
      coalesce((v_offer_row->>'amount')::numeric, (p_order->>'amount')::numeric, 0),
      coalesce(v_offer_row->>'from_currency', v_offer_row->>'fromCurrency', p_order->>'from_currency', p_order->>'fromCurrency', 'RUB'),
      coalesce(v_offer_row->>'to_currency', v_offer_row->>'toCurrency', p_order->>'to_currency', p_order->>'toCurrency', 'XOF'),
      coalesce((v_offer_row->>'rate')::numeric, (p_order->>'rate')::numeric, 0),
      coalesce(v_offer_row->>'status', 'accepted'),
      case
        when jsonb_typeof(v_offer_row->'payload') = 'object' then v_offer_row->'payload'
        else v_offer_row
      end,
      coalesce(
        (v_offer_row->>'created_at')::timestamptz,
        (v_offer_row->>'createdAt')::timestamptz,
        now()
      )
    );
  else
    update public.p2p_offers
    set status = 'accepted'
    where id = v_offer_id
      and status = 'active';
  end if;

  insert into public.p2p_orders (
    id,
    offer_id,
    buyer_id,
    buyer_name,
    seller_id,
    seller_name,
    amount,
    from_currency,
    to_currency,
    rate,
    fee,
    status,
    proofs,
    ratings,
    timeline,
    created_at
  ) values (
    p_order->>'id',
    v_offer_id,
    v_buyer::uuid,
    coalesce(p_order->>'buyer_name', p_order->>'buyerName', ''),
    v_seller::uuid,
    coalesce(p_order->>'seller_name', p_order->>'sellerName', ''),
    coalesce((p_order->>'amount')::numeric, 0),
    coalesce(p_order->>'from_currency', p_order->>'fromCurrency', 'RUB'),
    coalesce(p_order->>'to_currency', p_order->>'toCurrency', 'XOF'),
    coalesce((p_order->>'rate')::numeric, 0),
    coalesce((p_order->>'fee')::numeric, 0),
    coalesce(p_order->>'status', 'created'),
    coalesce(p_order->'proofs', '[]'::jsonb),
    coalesce(p_order->'ratings', '[]'::jsonb),
    coalesce(p_order->'timeline', '[]'::jsonb),
    coalesce(
      (p_order->>'created_at')::timestamptz,
      (p_order->>'createdAt')::timestamptz,
      now()
    )
  )
  on conflict (id) do update set
    status = excluded.status,
    proofs = excluded.proofs,
    ratings = excluded.ratings,
    timeline = excluded.timeline,
    fee = excluded.fee,
    amount = excluded.amount,
    rate = excluded.rate,
    buyer_name = excluded.buyer_name,
    seller_name = excluded.seller_name;

end;
$$;

notify pgrst, 'reload schema';
