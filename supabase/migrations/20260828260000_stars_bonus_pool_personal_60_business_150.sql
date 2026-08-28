-- Pool bonus : 60 ★ / mois (profil), 150 ★ / mois (entreprise).
-- Complète les soldes déjà ouverts ce mois sans rembourser les dépenses.

update public.stars_quota_config
set
  config = coalesce(config, '{}'::jsonb) || jsonb_build_object(
    'monthlyBonusPool', jsonb_build_object('personal', 60, 'business', 150)
  ),
  updated_at = now()
where id = 1;

do $$
declare
  rec record;
  v_cfg jsonb;
  v_period text := public.moxt_stars_current_period();
  v_quota integer;
  v_granted integer;
  v_topup integer;
  v_before integer;
begin
  select config into v_cfg from public.stars_quota_config where id = 1;

  for rec in
    select owner_type, owner_id, balance, granted_amount
    from public.stars_bonus_balances
    where category = 'pool'
      and period_yyyymm = v_period
    for update
  loop
    v_quota := coalesce(
      (
        v_cfg -> 'monthlyBonusPool' ->> case
          when rec.owner_type = 'business' then 'business'
          else 'personal'
        end
      )::integer,
      0
    );
    v_granted := coalesce(rec.granted_amount, rec.balance);
    v_topup := v_quota - v_granted;
    if v_topup <= 0 then
      continue;
    end if;

    v_before := rec.balance;

    update public.stars_bonus_balances
    set
      balance = rec.balance + v_topup,
      granted_amount = v_quota,
      reset_at = now()
    where owner_type = rec.owner_type
      and owner_id = rec.owner_id
      and category = 'pool'
      and period_yyyymm = v_period;

    insert into public.stars_transactions (
      owner_type, owner_id, kind, star_type, category, amount,
      balance_before, balance_after, ref_type, ref_id, idempotency_key, reason
    ) values (
      rec.owner_type, rec.owner_id, 'credit', 'bonus', 'pool', v_topup,
      v_before, v_before + v_topup, 'rollout_topup', v_period,
      'quota-bump-60-150:' || rec.owner_type || ':' || rec.owner_id || ':' || v_period,
      'Complément pool bonus (60 perso / 150 entreprise)'
    );
  end loop;
end;
$$;
