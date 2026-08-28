-- Paid Stars partagées perso + entreprise. Quotas bonus distincts, total combiné
-- utilisable depuis l’un ou l’autre profil (bonus du profil d’abord, puis l’autre, puis Paid).

create or replace function public.moxt_stars_linked_user_id(p_owner_type text, p_owner_id text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_owner_type is distinct from 'business' then
    return p_owner_id;
  end if;
  return (
    select b.owner_id::text
    from public.businesses b
    where b.id = p_owner_id
    limit 1
  );
end;
$$;

create or replace function public.moxt_stars_linked_business_id(p_user_id text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select b.id
  from public.businesses b
  where b.owner_id::text = p_user_id
  order by b.created_at asc nulls last
  limit 1;
$$;

-- Consolide le Paid entreprise sur le portefeuille perso du propriétaire.
do $$
declare
  rec record;
  v_user text;
  v_before integer;
begin
  for rec in
    select w.owner_id as business_id, w.paid_balance
    from public.stars_wallets w
    where w.owner_type = 'business' and w.paid_balance > 0
  loop
    v_user := public.moxt_stars_linked_user_id('business', rec.business_id);
    if v_user is null then
      continue;
    end if;
    perform public.moxt_stars_lock_wallet('user', v_user);
    perform public.moxt_stars_lock_wallet('business', rec.business_id);

    select paid_balance into v_before
    from public.stars_wallets
    where owner_type = 'user' and owner_id = v_user;

    update public.stars_wallets
    set paid_balance = paid_balance + rec.paid_balance, updated_at = now()
    where owner_type = 'user' and owner_id = v_user;

    update public.stars_wallets
    set paid_balance = 0, updated_at = now()
    where owner_type = 'business' and owner_id = rec.business_id;

    insert into public.stars_transactions (
      owner_type, owner_id, kind, star_type, category, amount,
      balance_before, balance_after, ref_type, ref_id, idempotency_key, reason
    ) values (
      'business', rec.business_id, 'debit', 'paid', null, rec.paid_balance,
      rec.paid_balance, 0, 'paid_share', v_user,
      'paid-share-out:' || rec.business_id, 'Transfert Paid vers le portefeuille personnel'
    );

    insert into public.stars_transactions (
      owner_type, owner_id, kind, star_type, category, amount,
      balance_before, balance_after, ref_type, ref_id, idempotency_key, reason
    ) values (
      'user', v_user, 'credit', 'paid', null, rec.paid_balance,
      coalesce(v_before, 0), coalesce(v_before, 0) + rec.paid_balance, 'paid_share', rec.business_id,
      'paid-share-in:' || rec.business_id, 'Paid Stars partagées (entreprise)'
    );
  end loop;
end;
$$;

create or replace function public.moxt_stars_spend_plan(
  p_owner_type text,
  p_owner_id text,
  p_total integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user text;
  v_biz text;
  v_primary_bonus integer := 0;
  v_secondary_bonus integer := 0;
  v_primary_use integer := 0;
  v_secondary_use integer := 0;
  v_paid_use integer := 0;
  v_paid integer := 0;
  v_remain integer := greatest(coalesce(p_total, 0), 0);
  v_secondary_type text;
  v_secondary_id text;
  v_wallet public.stars_wallets;
begin
  v_user := public.moxt_stars_linked_user_id(p_owner_type, p_owner_id);
  if v_user is null then
    v_user := p_owner_id;
  end if;
  if p_owner_type = 'business' then
    v_biz := p_owner_id;
  else
    v_biz := public.moxt_stars_linked_business_id(v_user);
  end if;

  v_wallet := public.moxt_stars_lock_wallet('user', v_user);
  v_paid := v_wallet.paid_balance;
  if v_biz is not null then
    perform public.moxt_stars_lock_wallet('business', v_biz);
  end if;

  v_primary_bonus := public.moxt_stars_ensure_bonus(
    p_owner_type,
    p_owner_id,
    'pool',
    case when p_owner_type = 'business' then 'business' else 'personal' end,
    false
  );

  if v_biz is not null and v_user is not null then
    if p_owner_type = 'business' then
      v_secondary_type := 'user';
      v_secondary_id := v_user;
    else
      v_secondary_type := 'business';
      v_secondary_id := v_biz;
    end if;
    v_secondary_bonus := public.moxt_stars_ensure_bonus(
      v_secondary_type,
      v_secondary_id,
      'pool',
      case when v_secondary_type = 'business' then 'business' else 'personal' end,
      false
    );
  end if;

  v_primary_use := least(v_primary_bonus, v_remain);
  v_remain := v_remain - v_primary_use;
  v_secondary_use := least(v_secondary_bonus, v_remain);
  v_remain := v_remain - v_secondary_use;
  v_paid_use := v_remain;

  return jsonb_build_object(
    'userId', v_user,
    'businessId', v_biz,
    'primaryType', p_owner_type,
    'primaryId', p_owner_id,
    'secondaryType', v_secondary_type,
    'secondaryId', v_secondary_id,
    'bonusPrimary', v_primary_use,
    'bonusSecondary', v_secondary_use,
    'bonus', v_primary_use + v_secondary_use,
    'paid', v_paid_use,
    'remainingBonus', v_primary_bonus,
    'remainingBonusSecondary', v_secondary_bonus,
    'remainingPaid', v_paid,
    'insufficient', v_paid_use > v_paid
  );
end;
$$;

create or replace function public.moxt_stars_apply_spend(
  p_plan jsonb,
  p_category text,
  p_ref_type text,
  p_ref_id text,
  p_idempotency_key text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_primary_use integer := coalesce((p_plan->>'bonusPrimary')::integer, 0);
  v_secondary_use integer := coalesce((p_plan->>'bonusSecondary')::integer, 0);
  v_paid_use integer := coalesce((p_plan->>'paid')::integer, 0);
  v_primary_type text := p_plan->>'primaryType';
  v_primary_id text := p_plan->>'primaryId';
  v_secondary_type text := p_plan->>'secondaryType';
  v_secondary_id text := p_plan->>'secondaryId';
  v_user text := p_plan->>'userId';
  v_bonus integer;
  v_wallet public.stars_wallets;
  v_pool text := 'pool';
begin
  if v_primary_use > 0 then
    v_bonus := public.moxt_stars_ensure_bonus(
      v_primary_type, v_primary_id, 'pool',
      case when v_primary_type = 'business' then 'business' else 'personal' end, false
    );
    if v_primary_use > v_bonus then
      raise exception 'Solde Stars insuffisant';
    end if;
    update public.stars_bonus_balances
    set balance = balance - v_primary_use
    where owner_type = v_primary_type
      and owner_id = v_primary_id
      and category = v_pool
      and period_yyyymm = public.moxt_stars_current_period();
    insert into public.stars_transactions (
      owner_type, owner_id, kind, star_type, category, amount,
      balance_before, balance_after, ref_type, ref_id, idempotency_key, reason, created_by
    ) values (
      v_primary_type, v_primary_id, 'debit', 'bonus', p_category, v_primary_use,
      v_bonus, v_bonus - v_primary_use, coalesce(p_ref_type, p_category), p_ref_id,
      p_idempotency_key, p_reason, auth.uid()
    );
  end if;

  if v_secondary_use > 0 and v_secondary_type is not null and v_secondary_id is not null then
    v_bonus := public.moxt_stars_ensure_bonus(
      v_secondary_type, v_secondary_id, 'pool',
      case when v_secondary_type = 'business' then 'business' else 'personal' end, false
    );
    if v_secondary_use > v_bonus then
      raise exception 'Solde Stars insuffisant';
    end if;
    update public.stars_bonus_balances
    set balance = balance - v_secondary_use
    where owner_type = v_secondary_type
      and owner_id = v_secondary_id
      and category = v_pool
      and period_yyyymm = public.moxt_stars_current_period();
    insert into public.stars_transactions (
      owner_type, owner_id, kind, star_type, category, amount,
      balance_before, balance_after, ref_type, ref_id, idempotency_key, reason, created_by
    ) values (
      v_secondary_type, v_secondary_id, 'debit', 'bonus', p_category, v_secondary_use,
      v_bonus, v_bonus - v_secondary_use, coalesce(p_ref_type, p_category), p_ref_id,
      p_idempotency_key || ':bonus2', p_reason, auth.uid()
    );
  end if;

  if v_paid_use > 0 then
    v_wallet := public.moxt_stars_lock_wallet('user', v_user);
    if v_paid_use > v_wallet.paid_balance then
      raise exception 'Solde Stars insuffisant';
    end if;
    update public.stars_wallets
    set paid_balance = paid_balance - v_paid_use, updated_at = now()
    where owner_type = 'user' and owner_id = v_user;
    insert into public.stars_transactions (
      owner_type, owner_id, kind, star_type, category, amount,
      balance_before, balance_after, ref_type, ref_id, idempotency_key, reason, created_by
    ) values (
      'user', v_user, 'debit', 'paid', p_category, v_paid_use,
      v_wallet.paid_balance, v_wallet.paid_balance - v_paid_use,
      coalesce(p_ref_type, p_category), p_ref_id,
      case when v_primary_use > 0 or v_secondary_use > 0 then p_idempotency_key || ':paid' else p_idempotency_key end,
      p_reason, auth.uid()
    );
  end if;
end;
$$;

create or replace function public.stars_get_balance(
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
  v_cfg jsonb;
  v_user text;
  v_biz text;
  v_wallet public.stars_wallets;
  v_personal integer := 0;
  v_business integer := 0;
  v_personal_quota integer := 0;
  v_business_quota integer := 0;
  v_granted integer;
  v_actor text := auth.uid()::text;
  v_period text := public.moxt_stars_current_period();
  v_current_bonus integer;
  v_current_quota integer;
begin
  perform public.moxt_stars_assert_owner(p_owner_type, v_owner_id);
  select config into v_cfg from public.stars_quota_config where id = 1;

  v_user := public.moxt_stars_linked_user_id(p_owner_type, v_owner_id);
  if v_user is null then
    v_user := v_owner_id;
  end if;
  v_biz := coalesce(
    case when p_owner_type = 'business' then v_owner_id else null end,
    public.moxt_stars_linked_business_id(v_user)
  );

  v_wallet := public.moxt_stars_lock_wallet('user', v_user);
  v_personal := public.moxt_stars_ensure_bonus('user', v_user, 'pool', 'personal', false);
  select granted_amount into v_granted
  from public.stars_bonus_balances
  where owner_type = 'user' and owner_id = v_user and category = 'pool' and period_yyyymm = v_period;
  v_personal_quota := coalesce(v_granted, (v_cfg -> 'monthlyBonusPool' ->> 'personal')::integer, 0);

  if v_biz is not null then
    perform public.moxt_stars_lock_wallet('business', v_biz);
    v_business := public.moxt_stars_ensure_bonus('business', v_biz, 'pool', 'business', false);
    select granted_amount into v_granted
    from public.stars_bonus_balances
    where owner_type = 'business' and owner_id = v_biz and category = 'pool' and period_yyyymm = v_period;
    v_business_quota := coalesce(v_granted, (v_cfg -> 'monthlyBonusPool' ->> 'business')::integer, 0);
  end if;

  if p_owner_type = 'business' then
    v_current_bonus := v_business;
    v_current_quota := v_business_quota;
  else
    v_current_bonus := v_personal;
    v_current_quota := v_personal_quota;
  end if;

  return jsonb_build_object(
    'ownerType', p_owner_type,
    'ownerId', v_owner_id,
    'paid', v_wallet.paid_balance,
    'sharedPaid', v_wallet.paid_balance,
    'bonus', jsonb_build_object('pool', v_current_bonus),
    'bonusPool', v_current_bonus,
    'bonusPoolGranted', v_current_quota,
    'personalBonus', v_personal,
    'personalBonusGranted', v_personal_quota,
    'businessBonus', v_business,
    'businessBonusGranted', v_business_quota,
    'linkedUserId', v_user,
    'linkedBusinessId', v_biz,
    'combinedTotal', v_wallet.paid_balance + v_personal + v_business,
    'quotas', jsonb_build_object('pool', v_current_quota),
    'config', v_cfg,
    'enforced', public.moxt_stars_is_enforced(v_actor),
    'period', v_period
  );
end;
$$;

create or replace function public.stars_quote(
  p_category text,
  p_owner_type text default 'user',
  p_owner_id text default null,
  p_duration_key text default null,
  p_formula_key text default 'standard'
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
  v_total integer;
  v_enforced boolean;
  v_formula text := coalesce(p_formula_key, 'standard');
  v_plan jsonb;
begin
  perform public.moxt_stars_assert_owner(p_owner_type, v_owner_id);
  select config into v_cfg from public.stars_quota_config where id = 1;
  v_enforced := public.moxt_stars_is_enforced(v_actor);
  v_total := public.moxt_stars_resolve_cost(p_category, v_formula, p_duration_key, v_cfg);

  if not v_enforced then
    return jsonb_build_object(
      'enforced', false,
      'skipped', true,
      'category', p_category,
      'formulaKey', v_formula,
      'durationKey', p_duration_key,
      'cost', v_total,
      'totalCost', v_total,
      'bonus', 0,
      'paid', 0,
      'insufficient', false,
      'remainingBonus', 0,
      'remainingPaid', 0
    );
  end if;

  v_plan := public.moxt_stars_spend_plan(p_owner_type, v_owner_id, v_total);

  return jsonb_build_object(
    'enforced', true,
    'skipped', false,
    'category', p_category,
    'formulaKey', v_formula,
    'durationKey', p_duration_key,
    'cost', v_total,
    'totalCost', v_total,
    'bonus', coalesce((v_plan->>'bonus')::integer, 0),
    'bonusPrimary', coalesce((v_plan->>'bonusPrimary')::integer, 0),
    'bonusSecondary', coalesce((v_plan->>'bonusSecondary')::integer, 0),
    'paid', coalesce((v_plan->>'paid')::integer, 0),
    'insufficient', coalesce((v_plan->>'insufficient')::boolean, false),
    'remainingBonus', coalesce((v_plan->>'remainingBonus')::integer, 0),
    'remainingBonusSecondary', coalesce((v_plan->>'remainingBonusSecondary')::integer, 0),
    'remainingPaid', coalesce((v_plan->>'remainingPaid')::integer, 0),
    'splitLabel', coalesce((v_plan->>'bonus')::integer, 0)::text || ' Bonus Stars + ' || coalesce((v_plan->>'paid')::integer, 0)::text || ' Paid Stars',
    'plan', v_plan
  );
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
  v_total integer;
  v_enforced boolean;
  v_formula text := case p_duration_key
    when '3d' then 'featured_3d'
    when '7d' then 'featured_7d'
    else 'featured_24h'
  end;
  v_plan jsonb;
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

  v_plan := public.moxt_stars_spend_plan(p_owner_type, v_owner_id, v_total);

  return jsonb_build_object(
    'enforced', true,
    'skipped', false,
    'category', 'boost',
    'entityType', p_entity_type,
    'durationKey', p_duration_key,
    'formulaKey', v_formula,
    'cost', v_total,
    'totalCost', v_total,
    'bonus', coalesce((v_plan->>'bonus')::integer, 0),
    'bonusPrimary', coalesce((v_plan->>'bonusPrimary')::integer, 0),
    'bonusSecondary', coalesce((v_plan->>'bonusSecondary')::integer, 0),
    'paid', coalesce((v_plan->>'paid')::integer, 0),
    'insufficient', coalesce((v_plan->>'insufficient')::boolean, false),
    'remainingBonus', coalesce((v_plan->>'remainingBonus')::integer, 0),
    'remainingPaid', coalesce((v_plan->>'remainingPaid')::integer, 0),
    'splitLabel', coalesce((v_plan->>'bonus')::integer, 0)::text || ' Bonus Stars + ' || coalesce((v_plan->>'paid')::integer, 0)::text || ' Paid Stars',
    'plan', v_plan
  );
end;
$$;

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
  v_plan jsonb;
  v_existing uuid;
  v_hours integer;
  v_expires timestamptz;
  v_formula text := coalesce(p_formula_key, 'standard');
  v_cfg jsonb;
  v_boost_hours integer;
  v_reason text := public.moxt_stars_spend_reason(p_category, p_ref_type);
  v_user text;
  v_biz text;
begin
  perform public.moxt_stars_assert_owner(p_owner_type, v_owner_id);
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency_key requise';
  end if;

  v_user := coalesce(public.moxt_stars_linked_user_id(p_owner_type, v_owner_id), v_owner_id);
  v_biz := case when p_owner_type = 'business' then v_owner_id else public.moxt_stars_linked_business_id(v_user) end;

  select id into v_existing
  from public.stars_transactions
  where idempotency_key in (p_idempotency_key, p_idempotency_key || ':paid', p_idempotency_key || ':bonus2')
    and (
      (owner_type = p_owner_type and owner_id = v_owner_id)
      or (owner_type = 'user' and owner_id = v_user)
      or (v_biz is not null and owner_type = 'business' and owner_id = v_biz)
    )
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

  v_plan := v_quote->'plan';
  perform public.moxt_stars_apply_spend(
    v_plan, p_category, p_ref_type, p_ref_id, p_idempotency_key, v_reason
  );

  if p_category = 'status' and p_duration_key is not null and p_ref_id is not null then
    select coalesce((config -> 'statusDurations' -> p_duration_key ->> 'hours')::integer, 24)
    into v_hours
    from public.stars_quota_config where id = 1;
    v_expires := now() + make_interval(hours => v_hours);
    insert into public.status_extensions (
      status_id, duration_key, hours, paid_cost, expires_at, created_by
    ) values (
      p_ref_id, p_duration_key, v_hours, coalesce((v_quote->>'paid')::integer, 0), v_expires, auth.uid()
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
    'bonus', coalesce((v_quote->>'bonus')::integer, 0),
    'paid', coalesce((v_quote->>'paid')::integer, 0),
    'splitLabel', v_quote->>'splitLabel',
    'formulaKey', v_formula
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
  v_plan jsonb;
  v_existing uuid;
  v_active uuid;
  v_hours integer;
  v_expires timestamptz;
  v_formula text := case p_duration_key
    when '3d' then 'featured_3d'
    when '7d' then 'featured_7d'
    else 'featured_24h'
  end;
  v_reason text := public.moxt_stars_spend_reason('boost', 'boost');
  v_user text;
  v_biz text;
begin
  perform public.moxt_stars_assert_owner(p_owner_type, v_owner_id);
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency_key requise';
  end if;
  if p_entity_id is null or length(trim(p_entity_id)) = 0 then
    raise exception 'entity_id requise';
  end if;

  v_user := coalesce(public.moxt_stars_linked_user_id(p_owner_type, v_owner_id), v_owner_id);
  v_biz := case when p_owner_type = 'business' then v_owner_id else public.moxt_stars_linked_business_id(v_user) end;

  select id into v_existing
  from public.stars_transactions
  where idempotency_key in (p_idempotency_key, p_idempotency_key || ':paid', p_idempotency_key || ':bonus2')
    and (
      (owner_type = p_owner_type and owner_id = v_owner_id)
      or (owner_type = 'user' and owner_id = v_user)
      or (v_biz is not null and owner_type = 'business' and owner_id = v_biz)
    )
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

  v_plan := v_quote->'plan';
  perform public.moxt_stars_apply_spend(
    v_plan, 'boost', 'boost', p_entity_id, p_idempotency_key, v_reason
  );

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
    'bonus', coalesce((v_quote->>'bonus')::integer, 0),
    'paid', coalesce((v_quote->>'paid')::integer, 0)
  );
end;
$$;

create or replace function public.stars_credit(
  p_owner_type text,
  p_owner_id text,
  p_amount integer,
  p_reason text,
  p_ref_type text default 'credit',
  p_ref_id text default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.stars_wallets;
  v_existing uuid;
  v_user text;
begin
  if auth.role() is distinct from 'service_role' and not public.moxt_stars_is_staff() then
    raise exception 'Crédit Stars réservé au serveur ou à l’admin';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Montant invalide';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'Motif obligatoire';
  end if;

  v_user := coalesce(public.moxt_stars_linked_user_id(p_owner_type, p_owner_id), p_owner_id);

  if p_idempotency_key is not null then
    select id into v_existing
    from public.stars_transactions
    where owner_type = 'user' and owner_id = v_user
      and idempotency_key = p_idempotency_key
    limit 1;
    if v_existing is not null then
      return jsonb_build_object('ok', true, 'idempotent', true);
    end if;
  end if;

  v_wallet := public.moxt_stars_lock_wallet('user', v_user);
  update public.stars_wallets
  set paid_balance = paid_balance + p_amount, updated_at = now()
  where owner_type = 'user' and owner_id = v_user;

  insert into public.stars_transactions (
    owner_type, owner_id, kind, star_type, category, amount,
    balance_before, balance_after, ref_type, ref_id, idempotency_key, reason, created_by
  ) values (
    'user', v_user, 'credit', 'paid', null, p_amount,
    v_wallet.paid_balance, v_wallet.paid_balance + p_amount,
    p_ref_type, p_ref_id, p_idempotency_key, p_reason, auth.uid()
  );

  return jsonb_build_object('ok', true, 'paid', v_wallet.paid_balance + p_amount);
end;
$$;

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
  v_recipient_user text;
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
  v_recipient_user := coalesce(public.moxt_stars_linked_user_id(p_recipient_type, p_recipient_id), p_recipient_id);
  if v_recipient_user = v_sender_id then
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

  v_recipient_wallet := public.moxt_stars_lock_wallet('user', v_recipient_user);

  update public.stars_wallets
  set paid_balance = paid_balance - p_amount, updated_at = now()
  where owner_type = 'user' and owner_id = v_sender_id;

  update public.stars_wallets
  set paid_balance = paid_balance + p_amount, updated_at = now()
  where owner_type = 'user' and owner_id = v_recipient_user;

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
    'user', v_recipient_user, 'credit', 'paid', 'gift', p_amount,
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

create or replace function public.stars_list_transactions(
  p_owner_type text default 'user',
  p_owner_id text default null,
  p_limit integer default 30,
  p_offset integer default 0
)
returns setof public.stars_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id text := coalesce(p_owner_id, auth.uid()::text);
  v_user text;
  v_biz text;
begin
  perform public.moxt_stars_assert_owner(p_owner_type, v_owner_id);
  v_user := coalesce(public.moxt_stars_linked_user_id(p_owner_type, v_owner_id), v_owner_id);
  v_biz := coalesce(
    case when p_owner_type = 'business' then v_owner_id else null end,
    public.moxt_stars_linked_business_id(v_user)
  );
  return query
    select *
    from public.stars_transactions
    where (owner_type = 'user' and owner_id = v_user)
       or (v_biz is not null and owner_type = 'business' and owner_id = v_biz)
    order by created_at desc
    limit greatest(1, least(coalesce(p_limit, 30), 100))
    offset greatest(0, coalesce(p_offset, 0));
end;
$$;

revoke all on function public.moxt_stars_linked_user_id(text, text) from public;
revoke all on function public.moxt_stars_linked_business_id(text) from public;
revoke all on function public.moxt_stars_spend_plan(text, text, integer) from public;
revoke all on function public.moxt_stars_apply_spend(jsonb, text, text, text, text, text) from public;
grant execute on function public.moxt_stars_linked_user_id(text, text) to authenticated;
grant execute on function public.moxt_stars_linked_business_id(text) to authenticated;

notify pgrst, 'reload schema';
