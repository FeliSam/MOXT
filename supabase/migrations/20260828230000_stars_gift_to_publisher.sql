-- Offrir des MOXT Stars à un profil ou une entreprise abonné(e).

create or replace function public.stars_gift_to_publisher(
  p_recipient_type text,
  p_recipient_id text,
  p_amount integer,
  p_idempotency_key text,
  p_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_id text := auth.uid()::text;
  v_sender_wallet public.stars_wallets;
  v_recipient_wallet public.stars_wallets;
  v_existing uuid;
  v_reason text;
begin
  if v_sender_id is null then
    raise exception 'Authentification requise';
  end if;
  if not public.moxt_stars_module_enabled() then
    raise exception 'Module Stars désactivé';
  end if;
  if p_recipient_type is distinct from 'user' and p_recipient_type is distinct from 'business' then
    raise exception 'Type de destinataire invalide';
  end if;
  if p_recipient_id is null or btrim(p_recipient_id) = '' then
    raise exception 'Destinataire invalide';
  end if;
  if p_amount is null or p_amount < 1 or p_amount > 500 then
    raise exception 'Montant invalide (1–500 Stars)';
  end if;
  if p_idempotency_key is null or length(btrim(p_idempotency_key)) = 0 then
    raise exception 'idempotency_key requise';
  end if;
  if p_recipient_type = 'user' and p_recipient_id = v_sender_id then
    raise exception 'Impossible de s’offrir des Stars';
  end if;

  if not exists (
    select 1
    from public.publisher_subscriptions ps
    where ps.subscriber_id::text = v_sender_id
      and ps.publisher_type = p_recipient_type
      and ps.publisher_id = p_recipient_id
  ) then
    raise exception 'Abonnement requis pour offrir des Stars';
  end if;

  select id into v_existing
  from public.stars_transactions
  where owner_type = 'user'
    and owner_id = v_sender_id
    and idempotency_key = p_idempotency_key
  limit 1;
  if v_existing is not null then
    return jsonb_build_object('ok', true, 'idempotent', true);
  end if;

  v_sender_wallet := public.moxt_stars_lock_wallet('user', v_sender_id);
  if coalesce(v_sender_wallet.paid_balance, 0) < p_amount then
    raise exception 'Solde Stars insuffisant';
  end if;

  v_recipient_wallet := public.moxt_stars_lock_wallet(p_recipient_type, p_recipient_id);

  update public.stars_wallets
  set paid_balance = paid_balance - p_amount, updated_at = now()
  where owner_type = 'user' and owner_id = v_sender_id;

  update public.stars_wallets
  set paid_balance = paid_balance + p_amount, updated_at = now()
  where owner_type = p_recipient_type and owner_id = p_recipient_id;

  v_reason := coalesce(nullif(btrim(p_message), ''), 'Cadeau Stars à un abonnement');

  insert into public.stars_transactions (
    owner_type, owner_id, kind, star_type, category, amount,
    balance_before, balance_after, ref_type, ref_id, idempotency_key, reason, created_by
  ) values (
    'user', v_sender_id, 'debit', 'paid', 'gift', p_amount,
    v_sender_wallet.paid_balance, v_sender_wallet.paid_balance - p_amount,
    'gift', p_recipient_type || ':' || p_recipient_id, p_idempotency_key, v_reason, auth.uid()
  );

  insert into public.stars_transactions (
    owner_type, owner_id, kind, star_type, category, amount,
    balance_before, balance_after, ref_type, ref_id, idempotency_key, reason, created_by
  ) values (
    p_recipient_type, p_recipient_id, 'credit', 'paid', 'gift', p_amount,
    v_recipient_wallet.paid_balance, v_recipient_wallet.paid_balance + p_amount,
    'gift', 'user:' || v_sender_id, p_idempotency_key || ':credit', v_reason, auth.uid()
  );

  return jsonb_build_object(
    'ok', true,
    'amount', p_amount,
    'recipientType', p_recipient_type,
    'recipientId', p_recipient_id,
    'remainingPaid', v_sender_wallet.paid_balance - p_amount
  );
end;
$$;

revoke all on function public.stars_gift_to_publisher(text, text, integer, text, text) from public;
grant execute on function public.stars_gift_to_publisher(text, text, integer, text, text) to authenticated;
