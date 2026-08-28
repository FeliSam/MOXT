-- MOXT Stars pricing v2: formules publication, pool bonus mensuel, boosts vedette.

create table if not exists public.stars_boosts (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('user', 'business')),
  owner_id text not null,
  entity_type text not null,
  entity_id text not null,
  formula_key text not null,
  stars_spent integer not null default 0 check (stars_spent >= 0),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  idempotency_key text,
  created_at timestamptz not null default now()
);

create unique index if not exists stars_boosts_idempotency_uidx
  on public.stars_boosts (owner_type, owner_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists stars_boosts_entity_active_idx
  on public.stars_boosts (entity_type, entity_id, status);

create index if not exists stars_boosts_expires_idx
  on public.stars_boosts (expires_at)
  where status = 'active';

alter table public.stars_boosts enable row level security;

drop policy if exists stars_boosts_read on public.stars_boosts;
create policy stars_boosts_read on public.stars_boosts
  for select to authenticated
  using (
    public.moxt_stars_is_staff()
    or (owner_type = 'user' and owner_id = auth.uid()::text)
    or (owner_type = 'business' and public.moxt_stars_owns_business(owner_id))
  );

revoke insert, update, delete on public.stars_boosts from authenticated, anon;

update public.stars_quota_config
set config = jsonb_build_object(
  'enabled', coalesce((config->>'enabled')::boolean, false),
  'rolloutPercent', coalesce((config->>'rolloutPercent')::integer, 0),
  'pilotUserIds', coalesce(config->'pilotUserIds', '[]'::jsonb),
  'monthlyBonusPool', jsonb_build_object('personal', 30, 'business', 100),
  'publish', jsonb_build_object(
    'marketplace', 20,
    'jobs', 20,
    'events', 20,
    'parcel', 20,
    'video', 25
  ),
  'publishFormulas', jsonb_build_object(
    'standard', jsonb_build_object('boostHours', 0),
    'featured_24h', jsonb_build_object(
      'boostHours', 24,
      'cost', jsonb_build_object('default', 45, 'video', 55)
    ),
    'featured_7d', jsonb_build_object(
      'boostHours', 168,
      'cost', jsonb_build_object('default', 90, 'video', 110)
    )
  ),
  'statusDurations', jsonb_build_object(
    '24h', jsonb_build_object('hours', 24, 'cost', 15),
    '3d', jsonb_build_object('hours', 72, 'cost', 28),
    '7d', jsonb_build_object('hours', 168, 'cost', 40)
  )
),
updated_at = now()
where id = 1;

create or replace function public.moxt_stars_resolve_cost(
  p_category text,
  p_formula_key text default 'standard',
  p_duration_key text default null,
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

  if p_category = 'status' and p_duration_key is not null then
    return coalesce((v_cfg -> 'statusDurations' -> p_duration_key ->> 'cost')::integer, 15);
  end if;

  if coalesce(p_formula_key, 'standard') = 'standard' then
    return coalesce((v_cfg -> 'publish' ->> p_category)::integer, 20);
  end if;

  v_costs := v_cfg -> 'publishFormulas' -> coalesce(p_formula_key, 'standard') -> 'cost';
  if v_costs is null then
    return coalesce((v_cfg -> 'publish' ->> p_category)::integer, 20);
  end if;

  if jsonb_typeof(v_costs) = 'number' then
    return v_costs::integer;
  end if;

  v_value := (v_costs ->> p_category)::integer;
  if v_value is not null then
    return v_value;
  end if;

  return coalesce((v_costs ->> 'default')::integer, (v_cfg -> 'publish' ->> p_category)::integer, 20);
end;
$$;

create or replace function public.moxt_stars_ensure_bonus(
  p_owner_type text,
  p_owner_id text,
  p_category text,
  p_plan text,
  p_prorata boolean default false
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg jsonb;
  v_period text := public.moxt_stars_current_period();
  v_quota integer;
  v_grant integer;
  v_days integer;
  v_remaining integer;
  v_balance integer;
  v_pool_category text := 'pool';
begin
  select config into v_cfg from public.stars_quota_config where id = 1;
  v_quota := coalesce((v_cfg -> 'monthlyBonusPool' ->> coalesce(p_plan, 'personal'))::integer, 0);

  select balance into v_balance
  from public.stars_bonus_balances
  where owner_type = p_owner_type
    and owner_id = p_owner_id
    and category = v_pool_category
    and period_yyyymm = v_period
  for update;

  if found then
    return v_balance;
  end if;

  v_grant := v_quota;
  if p_prorata then
    v_days := extract(day from (date_trunc('month', timezone('utc', now())) + interval '1 month - 1 day'))::integer;
    v_remaining := (v_days - extract(day from timezone('utc', now()))::integer + 1);
    v_grant := greatest(0, floor(v_quota::numeric * v_remaining / v_days)::integer);
  end if;

  insert into public.stars_bonus_balances (
    owner_type, owner_id, category, period_yyyymm, balance, reset_at
  ) values (
    p_owner_type, p_owner_id, v_pool_category, v_period, v_grant, now()
  );

  if v_grant > 0 then
    insert into public.stars_transactions (
      owner_type, owner_id, kind, star_type, category, amount,
      balance_before, balance_after, ref_type, reason, created_by
    ) values (
      p_owner_type, p_owner_id, 'credit', 'bonus', v_pool_category, v_grant,
      0, v_grant, 'monthly_grant', 'Pool bonus du mois', auth.uid()
    );
  end if;

  return v_grant;
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
  v_plan text := 'personal';
  v_cfg jsonb;
  v_wallet public.stars_wallets;
  v_pool integer;
  v_pool_quota integer;
  v_actor text := auth.uid()::text;
begin
  perform public.moxt_stars_assert_owner(p_owner_type, v_owner_id);
  select config into v_cfg from public.stars_quota_config where id = 1;
  if p_owner_type = 'business' then
    v_plan := 'business';
  end if;

  v_wallet := public.moxt_stars_lock_wallet(p_owner_type, v_owner_id);
  v_pool := public.moxt_stars_ensure_bonus(p_owner_type, v_owner_id, 'pool', v_plan, false);
  v_pool_quota := coalesce((v_cfg -> 'monthlyBonusPool' ->> v_plan)::integer, 0);

  return jsonb_build_object(
    'ownerType', p_owner_type,
    'ownerId', v_owner_id,
    'paid', v_wallet.paid_balance,
    'bonus', jsonb_build_object('pool', v_pool),
    'bonusPool', v_pool,
    'quotas', jsonb_build_object('pool', v_pool_quota),
    'config', v_cfg,
    'enforced', public.moxt_stars_is_enforced(v_actor),
    'period', public.moxt_stars_current_period()
  );
end;
$$;

drop function if exists public.stars_quote(text, text, text, text);

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
  v_plan text := case when p_owner_type = 'business' then 'business' else 'personal' end;
  v_total integer;
  v_bonus integer;
  v_paid integer;
  v_bonus_use integer;
  v_paid_use integer;
  v_enforced boolean;
  v_formula text := coalesce(p_formula_key, 'standard');
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
    'category', p_category,
    'formulaKey', v_formula,
    'durationKey', p_duration_key,
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

drop function if exists public.stars_consume(text, text, text, text, text, text, text);

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
      balance_before, balance_after, ref_type, ref_id, idempotency_key, created_by
    ) values (
      p_owner_type, v_owner_id, 'debit', 'bonus', p_category, v_bonus_use,
      v_bonus, v_bonus - v_bonus_use, coalesce(p_ref_type, p_category), p_ref_id,
      p_idempotency_key, auth.uid()
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
      p_owner_type, v_owner_id, 'debit', 'paid', p_category, v_paid_use,
      v_wallet.paid_balance, v_wallet.paid_balance - v_paid_use,
      coalesce(p_ref_type, p_category), p_ref_id,
      case when v_bonus_use > 0 then p_idempotency_key || ':paid' else p_idempotency_key end,
      auth.uid()
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

grant execute on function public.moxt_stars_resolve_cost(text, text, text, jsonb) to authenticated;
grant execute on function public.stars_quote(text, text, text, text, text) to authenticated;
grant execute on function public.stars_consume(text, text, text, text, text, text, text, text) to authenticated;
