-- Ne pas créditer ni notifier le pool bonus tant que le module Stars n’est pas actif.

create or replace function public.moxt_notify_stars_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_id text;
  v_title text;
  v_message text;
  v_priority text := 'normal';
  v_kind text := coalesce(new.kind, '');
  v_ref text := coalesce(new.ref_type, '');
  v_cat text := coalesce(new.category, '');
  v_amount integer := coalesce(new.amount, 0);
begin
  if not public.moxt_stars_module_enabled() then
    return new;
  end if;

  if new.idempotency_key ~* ':(paid|bonus)$' then
    return new;
  end if;

  v_id := left(
    'NOT-STARS-' || coalesce(nullif(btrim(new.idempotency_key), ''), new.id::text),
    60
  );

  if new.owner_type = 'user' then
    begin
      v_user := new.owner_id::uuid;
    exception
      when others then
        v_user := null;
    end;
  elsif new.owner_type = 'business' then
    select b.owner_id into v_user
    from public.businesses b
    where b.id = new.owner_id
    limit 1;
  end if;

  if v_user is null then
    return new;
  end if;

  if v_kind = 'credit' then
    v_priority := 'high';
    if v_ref = 'purchase' then
      v_title := 'Achat de Stars';
      v_message := v_amount::text || ' ★ ont été créditées sur votre portefeuille.';
    elsif v_ref = 'referral' then
      v_title := 'Parrainage Stars';
      v_message := left(coalesce(nullif(btrim(new.reason), ''), v_amount::text || ' ★ pour un filleul confirmé.'), 500);
    elsif v_ref = 'gift' or v_cat = 'gift' then
      v_title := 'Stars reçues';
      v_message := 'Vous avez reçu ' || v_amount::text || ' ★.';
    elsif v_ref in ('monthly_grant', 'rollout_topup') or v_cat in ('pool', 'bonus_pool') then
      v_title := 'Pool bonus';
      v_priority := 'normal';
      v_message := v_amount::text || ' ★ bonus ont été ajoutées ce mois-ci.';
    else
      v_title := 'Stars ajoutées';
      v_message := left(coalesce(nullif(btrim(new.reason), ''), v_amount::text || ' ★ ont été ajoutées à votre portefeuille.'), 500);
    end if;
  else
    if v_ref = 'gift' or v_cat = 'gift' then
      v_title := 'Stars offertes';
      v_message := 'Vous avez offert ' || v_amount::text || ' ★.';
    else
      v_title := 'Stars utilisées';
      v_message := left(coalesce(nullif(btrim(new.reason), ''), v_amount::text || ' ★ ont été utilisées.'), 500);
    end if;
  end if;

  begin
    insert into public.notifications (
      id, user_id, title, message, type, link, priority, read, archived, created_at, updated_at
    ) values (
      v_id,
      v_user,
      left(v_title, 200),
      left(v_message, 500),
      'stars',
      '/stars',
      v_priority,
      false,
      false,
      now(),
      now()
    )
    on conflict (id) do nothing;
  exception
    when others then
      raise warning 'moxt_notify_stars_ledger: %', sqlerrm;
  end;

  return new;
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
  v_balance integer;
  v_pool_category text := 'pool';
begin
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

  if not public.moxt_stars_module_enabled() then
    return 0;
  end if;

  select config into v_cfg from public.stars_quota_config where id = 1;
  v_quota := coalesce((v_cfg -> 'monthlyBonusPool' ->> coalesce(p_plan, 'personal'))::integer, 0);

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

notify pgrst, 'reload schema';
