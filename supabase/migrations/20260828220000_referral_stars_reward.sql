-- Récompense parrainage : +5 MOXT Stars (paid) par filleul confirmé.
-- Crédit uniquement si le module Stars est activé. Idempotent via referrals.status = rewarded.

create or replace function private.stars_system_credit(
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
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Montant invalide';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'Motif obligatoire';
  end if;
  if p_owner_type is distinct from 'user' or p_owner_id is null or btrim(p_owner_id) = '' then
    raise exception 'Propriétaire invalide';
  end if;

  if p_idempotency_key is not null then
    select id into v_existing
    from public.stars_transactions
    where owner_type = p_owner_type
      and owner_id = p_owner_id
      and idempotency_key = p_idempotency_key
    limit 1;
    if v_existing is not null then
      return jsonb_build_object('ok', true, 'idempotent', true);
    end if;
  end if;

  v_wallet := public.moxt_stars_lock_wallet(p_owner_type, p_owner_id);
  update public.stars_wallets
  set paid_balance = paid_balance + p_amount, updated_at = now()
  where owner_type = p_owner_type and owner_id = p_owner_id;

  insert into public.stars_transactions (
    owner_type, owner_id, kind, star_type, category, amount,
    balance_before, balance_after, ref_type, ref_id, idempotency_key, reason, created_by
  ) values (
    p_owner_type, p_owner_id, 'credit', 'paid', null, p_amount,
    v_wallet.paid_balance, v_wallet.paid_balance + p_amount,
    p_ref_type, p_ref_id, p_idempotency_key, p_reason, auth.uid()
  );

  return jsonb_build_object('ok', true, 'paid', v_wallet.paid_balance + p_amount);
end;
$$;

revoke all on function private.stars_system_credit(text, text, integer, text, text, text, text) from public;

create or replace function public.moxt_stars_module_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select (config ->> 'stars')::boolean
      from public.app_module_flags
      where id = 1
    ),
    false
  );
$$;

revoke all on function public.moxt_stars_module_enabled() from public;
grant execute on function public.moxt_stars_module_enabled() to authenticated, anon;

create or replace function public.moxt_reward_referral_row(p_referral_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.referrals%rowtype;
  v_reward constant integer := 5;
begin
  if not public.moxt_stars_module_enabled() then
    return false;
  end if;

  select * into v_row
  from public.referrals
  where id = p_referral_id
  for update;

  if not found then
    return false;
  end if;

  if v_row.status = 'rewarded' then
    return true;
  end if;

  if v_row.status is distinct from 'confirmed' then
    return false;
  end if;

  perform private.stars_system_credit(
    'user',
    v_row.referrer_id::text,
    v_reward,
    'Parrainage : +' || v_reward || ' Stars pour un filleul',
    'referral',
    v_row.id,
    'referral:' || v_row.id
  );

  update public.referrals
  set status = 'rewarded',
      reward_amount = v_reward
  where id = v_row.id;

  return true;
end;
$$;

revoke all on function public.moxt_reward_referral_row(text) from public;

create or replace function public.moxt_apply_referral(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_id uuid;
  v_referred_name text;
  v_normalized_code text := upper(btrim(coalesce(p_code, '')));
  v_referral_id text;
begin
  if v_normalized_code = '' or auth.uid() is null then
    return false;
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.phone_verified, false) = true
  ) then
    return false;
  end if;

  select p.id
  into v_referrer_id
  from public.profiles p
  where p.referral_code = v_normalized_code
  limit 1;

  if v_referrer_id is null or v_referrer_id = auth.uid() then
    return false;
  end if;

  if exists (
    select 1
    from public.referrals r
    where r.referred_user_id = auth.uid()
  ) then
    return false;
  end if;

  select nullif(btrim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), '')
  into v_referred_name
  from public.profiles
  where id = auth.uid();

  v_referral_id := 'REF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.referrals (
    id,
    referrer_id,
    referred_user_id,
    referred_user_name,
    status
  )
  values (
    v_referral_id,
    v_referrer_id,
    auth.uid(),
    coalesce(v_referred_name, 'Utilisateur'),
    'confirmed'
  )
  on conflict (referred_user_id) do nothing;

  if not found then
    return false;
  end if;

  begin
    perform public.moxt_reward_referral_row(v_referral_id);
  exception
    when others then
      raise warning 'Récompense Stars parrainage échouée pour %: %', v_referral_id, sqlerrm;
  end;

  return true;
end;
$$;

revoke all on function public.moxt_apply_referral(text) from public;
grant execute on function public.moxt_apply_referral(text) to authenticated;

-- Synchronise les invitations déjà confirmées (ex. historique) pour le parrain connecté.
create or replace function public.moxt_sync_my_referral_star_rewards()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_count integer := 0;
begin
  if auth.uid() is null then
    return 0;
  end if;
  if not public.moxt_stars_module_enabled() then
    return 0;
  end if;

  for v_row in
    select id
    from public.referrals
    where referrer_id = auth.uid()
      and status = 'confirmed'
    order by created_at asc
  loop
    if public.moxt_reward_referral_row(v_row.id) then
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.moxt_sync_my_referral_star_rewards() from public;
grant execute on function public.moxt_sync_my_referral_star_rewards() to authenticated;

notify pgrst, 'reload schema';
