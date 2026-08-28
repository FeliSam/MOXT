-- Pool bonus mensuel : crédit unique par période, solde immuable sauf dépense.

alter table public.stars_bonus_balances
  add column if not exists granted_amount integer check (granted_amount is null or granted_amount >= 0);

-- Quota du mois = max entre le crédit initial et le solde actuel (post-rollout août 2026).
update public.stars_bonus_balances b
set granted_amount = greatest(
  b.balance,
  coalesce(
    (select (c.config -> 'monthlyBonusPool' ->> case when b.owner_type = 'business' then 'business' else 'personal' end)::integer
     from public.stars_quota_config c where c.id = 1),
    b.balance
  )
)
where b.category = 'pool'
  and b.period_yyyymm = public.moxt_stars_current_period()
  and b.granted_amount is null;

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

  -- Solde déjà initialisé pour la période : inchangé tant que le mois n'est pas terminé.
  if found then
    return v_balance;
  end if;

  -- Nouvelle période : crédit mensuel complet (pas de prorata, pas de recalcul intra-mois).
  v_grant := v_quota;

  insert into public.stars_bonus_balances (
    owner_type, owner_id, category, period_yyyymm, balance, granted_amount, reset_at
  ) values (
    p_owner_type, p_owner_id, v_pool_category, v_period, v_grant, v_grant, now()
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
  v_granted integer;
  v_actor text := auth.uid()::text;
  v_period text := public.moxt_stars_current_period();
begin
  perform public.moxt_stars_assert_owner(p_owner_type, v_owner_id);
  select config into v_cfg from public.stars_quota_config where id = 1;
  if p_owner_type = 'business' then
    v_plan := 'business';
  end if;

  v_wallet := public.moxt_stars_lock_wallet(p_owner_type, v_owner_id);
  v_pool := public.moxt_stars_ensure_bonus(p_owner_type, v_owner_id, 'pool', v_plan, false);

  select granted_amount into v_granted
  from public.stars_bonus_balances
  where owner_type = p_owner_type
    and owner_id = v_owner_id
    and category = 'pool'
    and period_yyyymm = v_period;

  v_pool_quota := coalesce(
    v_granted,
    (v_cfg -> 'monthlyBonusPool' ->> v_plan)::integer,
    0
  );

  return jsonb_build_object(
    'ownerType', p_owner_type,
    'ownerId', v_owner_id,
    'paid', v_wallet.paid_balance,
    'bonus', jsonb_build_object('pool', v_pool),
    'bonusPool', v_pool,
    'bonusPoolGranted', v_pool_quota,
    'quotas', jsonb_build_object('pool', v_pool_quota),
    'config', v_cfg,
    'enforced', public.moxt_stars_is_enforced(v_actor),
    'period', v_period
  );
end;
$$;

create or replace function public.stars_monthly_reset()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  rec record;
begin
  for rec in
    select owner_type, owner_id from public.stars_wallets
  loop
    perform public.moxt_stars_ensure_bonus(
      rec.owner_type,
      rec.owner_id,
      'pool',
      case when rec.owner_type = 'business' then 'business' else 'personal' end,
      false
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;
