-- Boost post-publication + config boostFormulas + featured_3d pour le feed.

update public.stars_quota_config
set config = coalesce(config, '{}'::jsonb)
  || jsonb_build_object(
    'boostFormulas', jsonb_build_object(
      '24h', jsonb_build_object('hours', 24, 'cost', jsonb_build_object('default', 25, 'video', 35)),
      '3d', jsonb_build_object('hours', 72, 'cost', jsonb_build_object('default', 55, 'video', 75)),
      '7d', jsonb_build_object('hours', 168, 'cost', jsonb_build_object('default', 95, 'video', 125))
    )
  ),
updated_at = now()
where id = 1;

create or replace function public.moxt_stars_resolve_boost_cost(
  p_entity_type text,
  p_duration_key text default '24h',
  p_cfg jsonb default null
)
returns integer
language plpgsql
stable
as $$
declare
  v_cfg jsonb := p_cfg;
  v_costs jsonb;
  v_value integer;
begin
  if v_cfg is null then
    select config into v_cfg from public.stars_quota_config where id = 1;
  end if;

  v_costs := v_cfg -> 'boostFormulas' -> coalesce(p_duration_key, '24h') -> 'cost';
  if v_costs is null then
    return 25;
  end if;

  if jsonb_typeof(v_costs) = 'number' then
    return v_costs::integer;
  end if;

  if p_entity_type = 'video' then
    v_value := (v_costs ->> 'video')::integer;
    if v_value is not null then return v_value; end if;
  end if;

  return coalesce((v_costs ->> 'default')::integer, 25);
end;
$$;

create or replace function public.stars_quote_boost(
  p_entity_type text,
  p_owner_type text default 'user',
  p_owner_id text default null,
  p_duration_key text default '24h'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id text := coalesce(p_owner_id, auth.uid()::text);
  v_actor text := auth.uid()::text;
  v_cfg jsonb;
  v_plan text := case when p_owner_type = 'business' then 'business' else 'personal' end;
  v_total integer;
  v_bonus integer;
  v_paid integer;
  v_bonus_use integer;
  v_paid_use integer;
  v_enforced boolean;
  v_formula text := case p_duration_key
    when '3d' then 'featured_3d'
    when '7d' then 'featured_7d'
    else 'featured_24h'
  end;
begin
  perform public.moxt_stars_assert_owner(p_owner_type, v_owner_id);
  select config into v_cfg from public.stars_quota_config where id = 1;
  v_enforced := public.moxt_stars_is_enforced(v_actor);
  v_total := public.moxt_stars_resolve_boost_cost(p_entity_type, p_duration_key, v_cfg);

  if not v_enforced then
    return jsonb_build_object(
      'enforced', false,
      'skipped', true,
      'category', 'boost',
      'entityType', p_entity_type,
      'durationKey', p_duration_key,
      'formulaKey', v_formula,
      'cost', v_total,
      'totalCost', v_total,
      'bonus', 0,
      'paid', 0,
      'insufficient', false
    );
  end if;

  perform public.moxt_stars_lock_wallet(p_owner_type, v_owner_id);
  v_bonus := public.moxt_stars_ensure_bonus(p_owner_type, v_owner_id, 'pool', v_plan, false);
  select paid_balance into v_paid
  from public.stars_wallets
  where owner_type = p_owner_type and owner_id = v_owner_id;

  v_bonus_use := least(v_bonus, v_total);
  v_paid_use := v_total - v_bonus_use;

  return jsonb_build_object(
    'enforced', true,
    'skipped', false,
    'category', 'boost',
    'entityType', p_entity_type,
    'durationKey', p_duration_key,
    'formulaKey', v_formula,
    'cost', v_total,
    'totalCost', v_total,
    'bonus', v_bonus_use,
    'paid', v_paid_use,
    'insufficient', v_paid_use > coalesce(v_paid, 0),
    'remainingBonus', v_bonus,
    'remainingPaid', coalesce(v_paid, 0),
    'splitLabel', v_bonus_use::text || ' Bonus Stars + ' || v_paid_use::text || ' Paid Stars'
  );
end;
$$;

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
      and owner_id = p_owner_id
      and category = v_pool_category
      and period_yyyymm = public.moxt_stars_current_period();

    insert into public.stars_transactions (
      owner_type, owner_id, kind, star_type, category, amount,
      balance_before, balance_after, ref_type, ref_id, idempotency_key, created_by
    ) values (
      p_owner_type, v_owner_id, 'debit', 'bonus', 'boost', v_bonus_use,
      v_bonus, v_bonus - v_bonus_use, 'boost', p_entity_id, p_idempotency_key, auth.uid()
    );
  end if;

  if v_paid_use > 0 then
    update public.stars_wallets
    set paid_balance = paid_balance - v_paid_use, updated_at = now()
    where owner_type = p_owner_type and owner_id = v_owner_id;

    insert into public.stars_transactions (
      owner_type, owner_id, kind, star_type, category, amount,
      balance_before, balance_after, ref_type, ref_id,
      idempotency_key, created_by
    ) values (
      p_owner_type, v_owner_id, 'debit', 'paid', 'boost', v_paid_use,
      v_wallet.paid_balance, v_wallet.paid_balance - v_paid_use,
      'boost', p_entity_id,
      case when v_bonus_use > 0 then p_idempotency_key || ':paid' else p_idempotency_key end,
      auth.uid()
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

grant execute on function public.moxt_stars_resolve_boost_cost(text, text, jsonb) to authenticated;
grant execute on function public.stars_quote_boost(text, text, text, text) to authenticated;
grant execute on function public.stars_apply_boost(text, text, text, text, text, text) to authenticated;
