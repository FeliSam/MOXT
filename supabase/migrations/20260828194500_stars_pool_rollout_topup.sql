-- Compléter le pool bonus au quota mensuel complet (correction seed prorata mi-août).

do $$
declare
  rec record;
  v_cfg jsonb;
  v_period text := public.moxt_stars_current_period();
  v_quota integer;
  v_topup integer;
  v_before integer;
begin
  select config into v_cfg from public.stars_quota_config where id = 1;

  for rec in
    select owner_type, owner_id, balance,
      case when owner_type = 'business' then 'business' else 'personal' end as plan
    from public.stars_bonus_balances
    where category = 'pool'
      and period_yyyymm = v_period
  loop
    v_quota := coalesce((v_cfg -> 'monthlyBonusPool' ->> rec.plan)::integer, 0);
    v_topup := v_quota - rec.balance;
    if v_topup <= 0 then
      continue;
    end if;

    v_before := rec.balance;

    update public.stars_bonus_balances
    set balance = v_quota, reset_at = now()
    where owner_type = rec.owner_type
      and owner_id = rec.owner_id
      and category = 'pool'
      and period_yyyymm = v_period;

    insert into public.stars_transactions (
      owner_type, owner_id, kind, star_type, category, amount,
      balance_before, balance_after, ref_type, ref_id, idempotency_key, reason
    ) values (
      rec.owner_type, rec.owner_id, 'credit', 'bonus', 'pool', v_topup,
      v_before, v_quota, 'rollout_topup', v_period,
      'rollout-topup:' || rec.owner_type || ':' || rec.owner_id || ':' || v_period,
      'Complément pool bonus (activation rollout)'
    );
  end loop;
end;
$$;

-- Seed futur : pool mensuel complet (pas de prorata par catégorie v1).
create or replace function public.stars_seed_bonus_prorata()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  rec record;
begin
  if not public.moxt_stars_is_staff() and auth.role() is distinct from 'service_role' then
    raise exception 'Réservé aux administrateurs';
  end if;

  for rec in select id::text as owner_id from public.profiles
  loop
    perform public.moxt_stars_lock_wallet('user', rec.owner_id);
    perform public.moxt_stars_ensure_bonus('user', rec.owner_id, 'pool', 'personal', false);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;
