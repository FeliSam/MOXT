-- Motifs lisibles sur les débits Stars (publications, boosts, statuts).

create or replace function public.moxt_stars_spend_reason(
  p_category text,
  p_ref_type text default null
)
returns text
language sql
immutable
as $$
  select case
    when coalesce(p_ref_type, p_category) = 'boost' or p_category = 'boost' then 'Boost publication'
    when p_category = 'status' then 'Statut prolongé'
    when p_category = 'marketplace' then 'Publication marketplace'
    when p_category = 'jobs' then 'Publication job'
    when p_category = 'events' then 'Publication événement'
    when p_category = 'parcel' then 'Publication colis'
    when p_category = 'video' then 'Publication vidéo'
    else 'Utilisation Stars'
  end;
$$;

-- stars_consume : ajouter reason sur les débits
create or replace function public.stars_consume(
  p_category text,
  p_idempotency_key text,
  p_owner_type text default 'user',
  p_owner_id text default null,
  p_duration_key text default null,
  p_ref_type text default null,
  p_ref_id text default null,
  p_formula_key text default 'standard'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id text := coalesce(p_owner_id, auth.uid()::text);
  v_quote jsonb;
  v_wallet public.stars_wallets;
  v_plan text := case when p_owner_type = 'business' then 'business' else 'personal' end;
  v_bonus integer;
  v_bonus_use integer;
  v_paid_use integer;
  v_existing uuid;
  v_hours integer;
  v_expires timestamptz;
  v_formula text := coalesce(p_formula_key, 'standard');
  v_cfg jsonb;
  v_boost_hours integer;
  v_pool_category text := 'pool';
  v_reason text := public.moxt_stars_spend_reason(p_category, p_ref_type);
begin
  perform public.moxt_stars_assert_owner(p_owner_type, v_owner_id);
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency_key requise';
  end if;

  select id into v_existing
  from public.stars_transactions
  where owner_type = p_owner_type
    and owner_id = v_owner_id
    and idempotency_key = p_idempotency_key
  limit 1;

  if v_existing is not null then
    return jsonb_build_object('ok', true, 'idempotent', true, 'skipped', false);
  end if;

  v_quote := public.stars_quote(p_category, p_owner_type, v_owner_id, p_duration_key, v_formula);
  if coalesce((v_quote->>'skipped')::boolean, false) then
    return jsonb_build_object('ok', true, 'skipped', true, 'bonus', 0, 'paid', 0);
  end if;
  if coalesce((v_quote->>'insufficient')::boolean, false) then
    raise exception 'Solde Stars insuffisant';
  end if;

  v_bonus_use := coalesce((v_quote->>'bonus')::integer, 0);
  v_paid_use := coalesce((v_quote->>'paid')::integer, 0);

  v_wallet := public.moxt_stars_lock_wallet(p_owner_type, v_owner_id);
  v_bonus := public.moxt_stars_ensure_bonus(p_owner_type, v_owner_id, 'pool', v_plan, false);

  if v_bonus_use > v_bonus or v_paid_use > v_wallet.paid_balance then
    raise exception 'Solde Stars insuffisant';
  end if;

  if v_bonus_use > 0 then
    update public.stars_bonus_balances
    set balance = balance - v_bonus_use
    where owner_type = p_owner_type
      and owner_id = v_owner_id
      and category = v_pool_category
      and period_yyyymm = public.moxt_stars_current_period();

    insert into public.stars_transactions (
      owner_type, owner_id, kind, star_type, category, amount,
      balance_before, balance_after, ref_type, ref_id, idempotency_key, reason, created_by
    ) values (
      p_owner_type, v_owner_id, 'debit', 'bonus', p_category, v_bonus_use,
      v_bonus, v_bonus - v_bonus_use, coalesce(p_ref_type, p_category), p_ref_id,
      p_idempotency_key, v_reason, auth.uid()
    );
  end if;

  if v_paid_use > 0 then
    update public.stars_wallets
    set paid_balance = paid_balance - v_paid_use, updated_at = now()
    where owner_type = p_owner_type and owner_id = v_owner_id;

    insert into public.stars_transactions (
      owner_type, owner_id, kind, star_type, category, amount,
      balance_before, balance_after, ref_type, ref_id,
      idempotency_key, reason, created_by
    ) values (
      p_owner_type, v_owner_id, 'debit', 'paid', p_category, v_paid_use,
      v_wallet.paid_balance, v_wallet.paid_balance - v_paid_use,
      coalesce(p_ref_type, p_category), p_ref_id,
      case when v_bonus_use > 0 then p_idempotency_key || ':paid' else p_idempotency_key end,
      v_reason, auth.uid()
    );
  end if;

  if p_category = 'status' and p_duration_key is not null and p_ref_id is not null then
    select coalesce((config -> 'statusDurations' -> p_duration_key ->> 'hours')::integer, 24)
    into v_hours
    from public.stars_quota_config where id = 1;
    v_expires := now() + make_interval(hours => v_hours);
    insert into public.status_extensions (
      status_id, duration_key, hours, paid_cost, expires_at, created_by
    ) values (
      p_ref_id, p_duration_key, v_hours, v_paid_use, v_expires, auth.uid()
    );
  end if;

  if v_formula in ('featured_24h', 'featured_7d') and p_ref_id is not null then
    select config into v_cfg from public.stars_quota_config where id = 1;
    v_boost_hours := coalesce(
      (v_cfg -> 'publishFormulas' -> v_formula ->> 'boostHours')::integer,
      case when v_formula = 'featured_7d' then 168 else 24 end
    );
    v_expires := now() + make_interval(hours => v_boost_hours);
    insert into public.stars_boosts (
      owner_type, owner_id, entity_type, entity_id, formula_key,
      stars_spent, starts_at, expires_at, status, idempotency_key
    ) values (
      p_owner_type, v_owner_id, coalesce(p_ref_type, p_category), p_ref_id, v_formula,
      coalesce((v_quote->>'totalCost')::integer, 0),
      now(), v_expires, 'active', p_idempotency_key || ':boost'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'skipped', false,
    'bonus', v_bonus_use,
    'paid', v_paid_use,
    'splitLabel', v_quote->>'splitLabel',
    'formulaKey', v_formula
  );
end;
$$;

-- stars_apply_boost : ajouter reason sur les débits
create or replace function public.stars_apply_boost(
  p_entity_type text,
  p_entity_id text,
  p_duration_key text,
  p_idempotency_key text,
  p_owner_type text default 'user',
  p_owner_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id text := coalesce(p_owner_id, auth.uid()::text);
  v_quote jsonb;
  v_wallet public.stars_wallets;
  v_plan text := case when p_owner_type = 'business' then 'business' else 'personal' end;
  v_bonus integer;
  v_bonus_use integer;
  v_paid_use integer;
  v_existing uuid;
  v_active uuid;
  v_hours integer;
  v_expires timestamptz;
  v_formula text := case p_duration_key
    when '3d' then 'featured_3d'
    when '7d' then 'featured_7d'
    else 'featured_24h'
  end;
  v_pool_category text := 'pool';
  v_reason text := public.moxt_stars_spend_reason('boost', 'boost');
begin
  perform public.moxt_stars_assert_owner(p_owner_type, v_owner_id);
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency_key requise';
  end if;
  if p_entity_id is null or length(trim(p_entity_id)) = 0 then
    raise exception 'entity_id requise';
  end if;

  select id into v_existing
  from public.stars_transactions
  where owner_type = p_owner_type
    and owner_id = v_owner_id
    and idempotency_key = p_idempotency_key
  limit 1;
  if v_existing is not null then
    return jsonb_build_object('ok', true, 'idempotent', true);
  end if;

  select id into v_active
  from public.stars_boosts
  where entity_type = p_entity_type
    and entity_id = p_entity_id
    and status = 'active'
    and expires_at > now()
  limit 1;
  if v_active is not null then
    raise exception 'Un boost est déjà actif sur cette publication';
  end if;

  v_quote := public.stars_quote_boost(p_entity_type, p_owner_type, v_owner_id, p_duration_key);
  if coalesce((v_quote->>'skipped')::boolean, false) then
    return jsonb_build_object('ok', true, 'skipped', true);
  end if;
  if coalesce((v_quote->>'insufficient')::boolean, false) then
    raise exception 'Solde Stars insuffisant';
  end if;

  v_bonus_use := coalesce((v_quote->>'bonus')::integer, 0);
  v_paid_use := coalesce((v_quote->>'paid')::integer, 0);
  v_wallet := public.moxt_stars_lock_wallet(p_owner_type, v_owner_id);
  v_bonus := public.moxt_stars_ensure_bonus(p_owner_type, v_owner_id, 'pool', v_plan, false);

  if v_bonus_use > v_bonus or v_paid_use > v_wallet.paid_balance then
    raise exception 'Solde Stars insuffisant';
  end if;

  if v_bonus_use > 0 then
    update public.stars_bonus_balances
    set balance = balance - v_bonus_use
    where owner_type = p_owner_type
      and owner_id = v_owner_id
      and category = v_pool_category
      and period_yyyymm = public.moxt_stars_current_period();

    insert into public.stars_transactions (
      owner_type, owner_id, kind, star_type, category, amount,
      balance_before, balance_after, ref_type, ref_id, idempotency_key, reason, created_by
    ) values (
      p_owner_type, v_owner_id, 'debit', 'bonus', 'boost', v_bonus_use,
      v_bonus, v_bonus - v_bonus_use, 'boost', p_entity_id, p_idempotency_key, v_reason, auth.uid()
    );
  end if;

  if v_paid_use > 0 then
    update public.stars_wallets
    set paid_balance = paid_balance - v_paid_use, updated_at = now()
    where owner_type = p_owner_type and owner_id = v_owner_id;

    insert into public.stars_transactions (
      owner_type, owner_id, kind, star_type, category, amount,
      balance_before, balance_after, ref_type, ref_id,
      idempotency_key, reason, created_by
    ) values (
      p_owner_type, v_owner_id, 'debit', 'paid', 'boost', v_paid_use,
      v_wallet.paid_balance, v_wallet.paid_balance - v_paid_use,
      'boost', p_entity_id,
      case when v_bonus_use > 0 then p_idempotency_key || ':paid' else p_idempotency_key end,
      v_reason, auth.uid()
    );
  end if;

  select coalesce((config -> 'boostFormulas' -> p_duration_key ->> 'hours')::integer,
    case when p_duration_key = '7d' then 168 when p_duration_key = '3d' then 72 else 24 end)
  into v_hours
  from public.stars_quota_config where id = 1;

  v_expires := now() + make_interval(hours => v_hours);

  insert into public.stars_boosts (
    owner_type, owner_id, entity_type, entity_id, formula_key,
    stars_spent, starts_at, expires_at, status, idempotency_key
  ) values (
    p_owner_type, v_owner_id, p_entity_type, p_entity_id, v_formula,
    coalesce((v_quote->>'totalCost')::integer, 0),
    now(), v_expires, 'active', p_idempotency_key || ':boost'
  );

  return jsonb_build_object(
    'ok', true,
    'formulaKey', v_formula,
    'expiresAt', v_expires,
    'bonus', v_bonus_use,
    'paid', v_paid_use
  );
end;
$$;
