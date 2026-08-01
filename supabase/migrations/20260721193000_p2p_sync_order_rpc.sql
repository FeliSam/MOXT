-- Sync atomique commande P2P : garantit d'abord l'offre parente (FK p2p_orders_offer_id_fkey).
-- Cas typique : l'acheteur accepte une offre encore absente côté DB (createOffer vendeur raté)
-- ou ne peut pas UPDATE le statut (RLS « own offers » seulement).

create or replace function public.moxt_sync_p2p_order(p_order jsonb, p_offer jsonb default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_offer_id text := coalesce(p_order->>'offer_id', p_order->>'offerId');
  v_buyer uuid := nullif(coalesce(p_order->>'buyer_id', p_order->>'buyerId'), '')::uuid;
  v_seller uuid := nullif(coalesce(p_order->>'seller_id', p_order->>'sellerId'), '')::uuid;
  v_owner uuid;
  v_is_staff boolean;
  v_offer_row jsonb := p_offer;
begin
  if v_uid is null then
    raise exception 'Authentification requise';
  end if;

  if v_offer_id is null or length(trim(v_offer_id)) = 0 then
    raise exception 'offer_id manquant sur la commande P2P';
  end if;

  v_is_staff := exists (
    select 1 from public.profiles p
    where p.id = v_uid and p.role in ('admin', 'superadmin', 'moderator')
  );

  if not v_is_staff
     and v_uid is distinct from v_buyer
     and v_uid is distinct from v_seller then
    raise exception 'Accès refusé à cette commande P2P';
  end if;

  -- 1) Offre parente
  if not exists (select 1 from public.p2p_offers where id = v_offer_id) then
    if v_offer_row is null then
      raise exception
        'Offre P2P introuvable (%). Le vendeur doit republier l''offre, puis réessayez.',
        v_offer_id;
    end if;

    v_owner := nullif(coalesce(v_offer_row->>'owner_id', v_offer_row->>'ownerId'), '')::uuid;
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
      v_owner,
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

  -- 2) Commande
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
    v_buyer,
    coalesce(p_order->>'buyer_name', p_order->>'buyerName', ''),
    v_seller,
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

revoke all on function public.moxt_sync_p2p_order(jsonb, jsonb) from public;
grant execute on function public.moxt_sync_p2p_order(jsonb, jsonb) to authenticated, service_role;

-- L'acheteur peut marquer une offre active comme acceptée (hors RPC, upsert direct).
drop policy if exists "MOXT accept active p2p offer" on public.p2p_offers;
create policy "MOXT accept active p2p offer"
on public.p2p_offers
for update
to authenticated
using (status = 'active')
with check (status = 'accepted');

notify pgrst, 'reload schema';
