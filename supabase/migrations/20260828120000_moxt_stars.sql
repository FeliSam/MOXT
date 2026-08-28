-- MOXT Stars: wallets, bonus by category, immutable ledger, packs, purchases,
-- quota config. Additive only. Writes go through SECURITY DEFINER RPCs.

create table if not exists public.stars_quota_config (
  id smallint primary key default 1 check (id = 1),
  config jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

insert into public.stars_quota_config (id, config)
values (
  1,
  jsonb_build_object(
    'enabled', false,
    'rolloutPercent', 0,
    'pilotUserIds', '[]'::jsonb,
    'personal', jsonb_build_object(
      'marketplace', 5, 'jobs', 5, 'events', 5, 'parcel', 5, 'video', 1, 'status', 3
    ),
    'business', jsonb_build_object(
      'marketplace', 5, 'jobs', 5, 'events', 5, 'parcel', 5, 'video', 3, 'status', 3
    ),
    'actionCost', jsonb_build_object(
      'marketplace', 1, 'jobs', 1, 'events', 1, 'parcel', 1, 'video', 1, 'status', 1, 'boost', 0
    ),
    'statusDurations', jsonb_build_object(
      '24h', jsonb_build_object('hours', 24, 'extraPaid', 0),
      '3d', jsonb_build_object('hours', 72, 'extraPaid', 10),
      '7d', jsonb_build_object('hours', 168, 'extraPaid', 25)
    )
  )
)
on conflict (id) do nothing;

create table if not exists public.stars_wallets (
  owner_type text not null check (owner_type in ('user', 'business')),
  owner_id text not null,
  paid_balance integer not null default 0 check (paid_balance >= 0),
  updated_at timestamptz not null default now(),
  primary key (owner_type, owner_id)
);

create table if not exists public.stars_bonus_balances (
  owner_type text not null check (owner_type in ('user', 'business')),
  owner_id text not null,
  category text not null,
  period_yyyymm text not null,
  balance integer not null default 0 check (balance >= 0),
  reset_at timestamptz not null default now(),
  primary key (owner_type, owner_id, category, period_yyyymm)
);

create table if not exists public.stars_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('user', 'business')),
  owner_id text not null,
  kind text not null check (kind in ('credit', 'debit')),
  star_type text not null check (star_type in ('bonus', 'paid')),
  category text,
  amount integer not null check (amount > 0),
  balance_before integer not null,
  balance_after integer not null,
  ref_type text,
  ref_id text,
  idempotency_key text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid
);

create unique index if not exists stars_transactions_idempotency_uidx
  on public.stars_transactions (owner_type, owner_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists stars_transactions_owner_created_idx
  on public.stars_transactions (owner_type, owner_id, created_at desc);

create table if not exists public.stars_packages (
  id text primary key,
  stars integer not null check (stars > 0),
  price_rub integer not null check (price_rub > 0),
  bonus_stars integer not null default 0 check (bonus_stars >= 0),
  title text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.stars_packages (id, stars, price_rub, bonus_stars, title, sort_order)
values
  ('pack-50', 50, 149, 0, '50 Stars', 10),
  ('pack-150', 150, 399, 15, '150 Stars + 15', 20),
  ('pack-400', 400, 990, 50, '400 Stars + 50', 30)
on conflict (id) do nothing;

create table if not exists public.stars_purchases (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('user', 'business')),
  owner_id text not null,
  package_id text references public.stars_packages (id),
  stars integer not null,
  bonus_stars integer not null default 0,
  price_rub integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  provider text not null default 'stub',
  provider_payment_id text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  created_by uuid
);

create unique index if not exists stars_purchases_idempotency_uidx
  on public.stars_purchases (owner_type, owner_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.status_extensions (
  id uuid primary key default gen_random_uuid(),
  status_id text not null,
  duration_key text not null,
  hours integer not null,
  paid_cost integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists status_extensions_status_idx on public.status_extensions (status_id);

create or replace function public.stars_forbid_txn_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'stars_transactions is append-only';
end;
$$;

drop trigger if exists stars_transactions_no_update on public.stars_transactions;
create trigger stars_transactions_no_update
  before update or delete on public.stars_transactions
  for each row execute function public.stars_forbid_txn_mutation();

alter table public.stars_quota_config enable row level security;
alter table public.stars_wallets enable row level security;
alter table public.stars_bonus_balances enable row level security;
alter table public.stars_transactions enable row level security;
alter table public.stars_packages enable row level security;
alter table public.stars_purchases enable row level security;
alter table public.status_extensions enable row level security;

create or replace function public.moxt_stars_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'superadmin')
  );
$$;

create or replace function public.moxt_stars_owns_business(p_business_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.businesses b
    where b.id = p_business_id and b.owner_id = auth.uid()::text
  );
$$;

drop policy if exists stars_quota_config_read on public.stars_quota_config;
create policy stars_quota_config_read on public.stars_quota_config
  for select to authenticated using (true);

drop policy if exists stars_packages_read on public.stars_packages;
create policy stars_packages_read on public.stars_packages
  for select to authenticated using (true);

drop policy if exists stars_wallets_read on public.stars_wallets;
create policy stars_wallets_read on public.stars_wallets
  for select to authenticated
  using (
    public.moxt_stars_is_staff()
    or (owner_type = 'user' and owner_id = auth.uid()::text)
    or (owner_type = 'business' and public.moxt_stars_owns_business(owner_id))
  );

drop policy if exists stars_bonus_read on public.stars_bonus_balances;
create policy stars_bonus_read on public.stars_bonus_balances
  for select to authenticated
  using (
    public.moxt_stars_is_staff()
    or (owner_type = 'user' and owner_id = auth.uid()::text)
    or (owner_type = 'business' and public.moxt_stars_owns_business(owner_id))
  );

drop policy if exists stars_txn_read on public.stars_transactions;
create policy stars_txn_read on public.stars_transactions
  for select to authenticated
  using (
    public.moxt_stars_is_staff()
    or (owner_type = 'user' and owner_id = auth.uid()::text)
    or (owner_type = 'business' and public.moxt_stars_owns_business(owner_id))
  );

drop policy if exists stars_purchases_read on public.stars_purchases;
create policy stars_purchases_read on public.stars_purchases
  for select to authenticated
  using (
    public.moxt_stars_is_staff()
    or (owner_type = 'user' and owner_id = auth.uid()::text)
    or (owner_type = 'business' and public.moxt_stars_owns_business(owner_id))
  );

drop policy if exists status_extensions_read on public.status_extensions;
create policy status_extensions_read on public.status_extensions
  for select to authenticated
  using (created_by = auth.uid() or public.moxt_stars_is_staff());

revoke insert, update, delete on public.stars_wallets from authenticated, anon;
revoke insert, update, delete on public.stars_bonus_balances from authenticated, anon;
revoke insert, update, delete on public.stars_transactions from authenticated, anon;
revoke insert, update, delete on public.stars_purchases from authenticated, anon;
revoke insert, update, delete on public.stars_quota_config from authenticated, anon;
revoke insert, update, delete on public.stars_packages from authenticated, anon;
revoke insert, update, delete on public.status_extensions from authenticated, anon;

create or replace function public.moxt_stars_current_period()
returns text
language sql
stable
as $$
  select to_char(timezone('utc', now()), 'YYYYMM');
$$;

create or replace function public.moxt_stars_assert_owner(p_owner_type text, p_owner_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.moxt_stars_is_staff() then
    return;
  end if;
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;
  if p_owner_type = 'user' then
    if p_owner_id is distinct from auth.uid()::text then
      raise exception 'Portefeuille utilisateur non autorisé';
    end if;
    return;
  end if;
  if p_owner_type = 'business' then
    if not public.moxt_stars_owns_business(p_owner_id) then
      raise exception 'Portefeuille entreprise non autorisé';
    end if;
    return;
  end if;
  raise exception 'owner_type invalide';
end;
$$;

create or replace function public.moxt_stars_is_enforced(p_user_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cfg jsonb;
  v_enabled boolean;
  v_percent integer;
  v_pilots jsonb;
begin
  select config into v_cfg from public.stars_quota_config where id = 1;
  if v_cfg is null then
    return false;
  end if;
  v_enabled := coalesce((v_cfg->>'enabled')::boolean, false);
  if not v_enabled then
    return false;
  end if;
  v_pilots := coalesce(v_cfg->'pilotUserIds', '[]'::jsonb);
  if v_pilots ? p_user_id then
    return true;
  end if;
  v_percent := coalesce((v_cfg->>'rolloutPercent')::integer, 0);
  if v_percent >= 100 then
    return true;
  end if;
  if v_percent <= 0 then
    return false;
  end if;
  return abs(hashtext(coalesce(p_user_id, ''))) % 100 < v_percent;
end;
$$;

create or replace function public.moxt_stars_lock_wallet(p_owner_type text, p_owner_id text)
returns public.stars_wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.stars_wallets;
begin
  insert into public.stars_wallets (owner_type, owner_id, paid_balance)
  values (p_owner_type, p_owner_id, 0)
  on conflict (owner_type, owner_id) do nothing;

  select * into v_row
  from public.stars_wallets
  where owner_type = p_owner_type and owner_id = p_owner_id
  for update;

  return v_row;
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
begin
  select config into v_cfg from public.stars_quota_config where id = 1;
  v_quota := coalesce((v_cfg -> coalesce(p_plan, 'personal') ->> p_category)::integer, 0);

  select balance into v_balance
  from public.stars_bonus_balances
  where owner_type = p_owner_type
    and owner_id = p_owner_id
    and category = p_category
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
    p_owner_type, p_owner_id, p_category, v_period, v_grant, now()
  );

  if v_grant > 0 then
    insert into public.stars_transactions (
      owner_type, owner_id, kind, star_type, category, amount,
      balance_before, balance_after, ref_type, reason, created_by
    ) values (
      p_owner_type, p_owner_id, 'credit', 'bonus', p_category, v_grant,
      0, v_grant, 'monthly_grant', 'Quota bonus du mois', auth.uid()
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
  v_bonus jsonb := '{}'::jsonb;
  v_cat text;
  v_bal integer;
  v_actor text := auth.uid()::text;
begin
  perform public.moxt_stars_assert_owner(p_owner_type, v_owner_id);
  select config into v_cfg from public.stars_quota_config where id = 1;
  if p_owner_type = 'business' then
    v_plan := 'business';
  end if;

  v_wallet := public.moxt_stars_lock_wallet(p_owner_type, v_owner_id);

  for v_cat in select unnest(array['marketplace', 'jobs', 'events', 'parcel', 'video', 'status'])
  loop
    v_bal := public.moxt_stars_ensure_bonus(p_owner_type, v_owner_id, v_cat, v_plan, false);
    v_bonus := v_bonus || jsonb_build_object(v_cat, v_bal);
  end loop;

  return jsonb_build_object(
    'ownerType', p_owner_type,
    'ownerId', v_owner_id,
    'paid', v_wallet.paid_balance,
    'bonus', v_bonus,
    'quotas', coalesce(v_cfg -> v_plan, '{}'::jsonb),
    'config', v_cfg,
    'enforced', public.moxt_stars_is_enforced(v_actor),
    'period', public.moxt_stars_current_period()
  );
end;
$$;

create or replace function public.stars_quote(
  p_category text,
  p_owner_type text default 'user',
  p_owner_id text default null,
  p_duration_key text default null
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
  v_cost integer;
  v_extra integer := 0;
  v_bonus integer;
  v_paid integer;
  v_bonus_use integer;
  v_paid_use integer;
  v_enforced boolean;
begin
  perform public.moxt_stars_assert_owner(p_owner_type, v_owner_id);
  select config into v_cfg from public.stars_quota_config where id = 1;
  v_enforced := public.moxt_stars_is_enforced(v_actor);

  v_cost := coalesce((v_cfg -> 'actionCost' ->> p_category)::integer, 1);
  if p_duration_key is not null then
    v_extra := coalesce((v_cfg -> 'statusDurations' -> p_duration_key ->> 'extraPaid')::integer, 0);
  end if;

  if not v_enforced then
    return jsonb_build_object(
      'enforced', false,
      'skipped', true,
      'category', p_category,
      'cost', v_cost,
      'extraPaid', v_extra,
      'bonus', 0,
      'paid', 0,
      'insufficient', false,
      'remainingBonus', 0,
      'remainingPaid', 0
    );
  end if;

  perform public.moxt_stars_lock_wallet(p_owner_type, v_owner_id);
  v_bonus := public.moxt_stars_ensure_bonus(p_owner_type, v_owner_id, p_category, v_plan, false);
  select paid_balance into v_paid
  from public.stars_wallets
  where owner_type = p_owner_type and owner_id = v_owner_id;

  v_bonus_use := least(v_bonus, v_cost);
  v_paid_use := (v_cost - v_bonus_use) + v_extra;

  return jsonb_build_object(
    'enforced', true,
    'skipped', false,
    'category', p_category,
    'cost', v_cost,
    'extraPaid', v_extra,
    'bonus', v_bonus_use,
    'paid', v_paid_use,
    'insufficient', v_paid_use > coalesce(v_paid, 0),
    'remainingBonus', v_bonus,
    'remainingPaid', coalesce(v_paid, 0),
    'splitLabel', v_bonus_use::text || ' Bonus Stars + ' || v_paid_use::text || ' Paid Stars'
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
  p_ref_id text default null
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

  v_quote := public.stars_quote(p_category, p_owner_type, v_owner_id, p_duration_key);
  if coalesce((v_quote->>'skipped')::boolean, false) then
    return jsonb_build_object('ok', true, 'skipped', true, 'bonus', 0, 'paid', 0);
  end if;
  if coalesce((v_quote->>'insufficient')::boolean, false) then
    raise exception 'Solde Stars insuffisant';
  end if;

  v_bonus_use := coalesce((v_quote->>'bonus')::integer, 0);
  v_paid_use := coalesce((v_quote->>'paid')::integer, 0);

  v_wallet := public.moxt_stars_lock_wallet(p_owner_type, v_owner_id);
  v_bonus := public.moxt_stars_ensure_bonus(p_owner_type, v_owner_id, p_category, v_plan, false);

  if v_bonus_use > v_bonus or v_paid_use > v_wallet.paid_balance then
    raise exception 'Solde Stars insuffisant';
  end if;

  if v_bonus_use > 0 then
    update public.stars_bonus_balances
    set balance = balance - v_bonus_use
    where owner_type = p_owner_type
      and owner_id = v_owner_id
      and category = p_category
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

  return jsonb_build_object(
    'ok', true,
    'skipped', false,
    'bonus', v_bonus_use,
    'paid', v_paid_use,
    'splitLabel', v_quote->>'splitLabel'
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

  if p_idempotency_key is not null then
    select id into v_existing
    from public.stars_transactions
    where owner_type = p_owner_type and owner_id = p_owner_id
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

create or replace function public.stars_refund_failed_publish(
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
  rec record;
  v_refund_key text;
begin
  perform public.moxt_stars_assert_owner(p_owner_type, v_owner_id);
  v_refund_key := 'refund:' || p_idempotency_key;

  for rec in
    select * from public.stars_transactions
    where owner_type = p_owner_type
      and owner_id = v_owner_id
      and kind = 'debit'
      and (
        idempotency_key = p_idempotency_key
        or idempotency_key = p_idempotency_key || ':paid'
      )
  loop
    v_refund_key := 'refund:' || rec.id::text;
    if exists (
      select 1 from public.stars_transactions
      where owner_type = p_owner_type
        and owner_id = v_owner_id
        and idempotency_key = v_refund_key
    ) then
      continue;
    end if;

    if rec.star_type = 'paid' then
      perform public.moxt_stars_lock_wallet(p_owner_type, v_owner_id);
      update public.stars_wallets
      set paid_balance = paid_balance + rec.amount, updated_at = now()
      where owner_type = p_owner_type and owner_id = v_owner_id;

      insert into public.stars_transactions (
        owner_type, owner_id, kind, star_type, category, amount,
        balance_before, balance_after, ref_type, ref_id, idempotency_key, reason, created_by
      )
      select
        p_owner_type, v_owner_id, 'credit', 'paid', rec.category, rec.amount,
        w.paid_balance - rec.amount, w.paid_balance,
        'refund_failed_publish', rec.ref_id, v_refund_key,
        'Remboursement publication échouée', auth.uid()
      from public.stars_wallets w
      where w.owner_type = p_owner_type and w.owner_id = v_owner_id;
    else
      update public.stars_bonus_balances
      set balance = balance + rec.amount
      where owner_type = p_owner_type
        and owner_id = v_owner_id
        and category = rec.category
        and period_yyyymm = public.moxt_stars_current_period();

      insert into public.stars_transactions (
        owner_type, owner_id, kind, star_type, category, amount,
        balance_before, balance_after, ref_type, ref_id, idempotency_key, reason, created_by
      )
      select
        p_owner_type, v_owner_id, 'credit', 'bonus', rec.category, rec.amount,
        b.balance - rec.amount, b.balance,
        'refund_failed_publish', rec.ref_id, v_refund_key,
        'Remboursement publication échouée', auth.uid()
      from public.stars_bonus_balances b
      where b.owner_type = p_owner_type
        and b.owner_id = v_owner_id
        and b.category = rec.category
        and b.period_yyyymm = public.moxt_stars_current_period();
    end if;
  end loop;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.stars_admin_adjust(
  p_owner_type text,
  p_owner_id text,
  p_amount integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.moxt_stars_is_staff() then
    raise exception 'Réservé aux administrateurs';
  end if;
  if p_amount = 0 then
    raise exception 'Montant invalide';
  end if;
  if p_amount > 0 then
    return public.stars_credit(p_owner_type, p_owner_id, p_amount, p_reason, 'admin_adjust', null, null);
  end if;

  perform public.moxt_stars_lock_wallet(p_owner_type, p_owner_id);
  update public.stars_wallets
  set paid_balance = paid_balance + p_amount, updated_at = now()
  where owner_type = p_owner_type
    and owner_id = p_owner_id
    and paid_balance + p_amount >= 0;
  if not found then
    raise exception 'Solde insuffisant pour cet ajustement';
  end if;

  insert into public.stars_transactions (
    owner_type, owner_id, kind, star_type, amount,
    balance_before, balance_after, ref_type, reason, created_by
  )
  select
    p_owner_type, p_owner_id, 'debit', 'paid', abs(p_amount),
    paid_balance - p_amount, paid_balance, 'admin_adjust', p_reason, auth.uid()
  from public.stars_wallets
  where owner_type = p_owner_type and owner_id = p_owner_id;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.stars_admin_update_config(p_config jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.moxt_stars_is_staff() then
    raise exception 'Réservé aux administrateurs';
  end if;
  update public.stars_quota_config
  set config = p_config, updated_at = now(), updated_by = auth.uid()
  where id = 1;
  return p_config;
end;
$$;

create or replace function public.stars_create_purchase(
  p_package_id text,
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
  v_pack public.stars_packages;
  v_row public.stars_purchases;
begin
  perform public.moxt_stars_assert_owner(p_owner_type, v_owner_id);
  select * into v_pack from public.stars_packages where id = p_package_id and active;
  if not found then
    raise exception 'Pack introuvable';
  end if;

  if p_idempotency_key is not null then
    select * into v_row
    from public.stars_purchases
    where owner_type = p_owner_type
      and owner_id = v_owner_id
      and idempotency_key = p_idempotency_key;
    if found then
      return jsonb_build_object(
        'purchaseId', v_row.id,
        'status', v_row.status,
        'provider', v_row.provider,
        'stars', v_row.stars + v_row.bonus_stars,
        'priceRub', v_row.price_rub
      );
    end if;
  end if;

  insert into public.stars_purchases (
    owner_type, owner_id, package_id, stars, bonus_stars, price_rub,
    status, provider, idempotency_key, created_by
  ) values (
    p_owner_type, v_owner_id, v_pack.id, v_pack.stars, v_pack.bonus_stars, v_pack.price_rub,
    'pending', 'stub', p_idempotency_key, auth.uid()
  )
  returning * into v_row;

  return jsonb_build_object(
    'purchaseId', v_row.id,
    'status', v_row.status,
    'provider', 'stub',
    'stars', v_row.stars + v_row.bonus_stars,
    'priceRub', v_row.price_rub
  );
end;
$$;

create or replace function public.stars_fulfill_purchase(p_purchase_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.stars_purchases;
  v_total integer;
begin
  if auth.role() is distinct from 'service_role' and not public.moxt_stars_is_staff() then
    raise exception 'Confirmation d’achat non autorisée';
  end if;

  select * into v_row from public.stars_purchases where id = p_purchase_id for update;
  if not found then
    raise exception 'Achat introuvable';
  end if;
  if v_row.status = 'paid' then
    return jsonb_build_object('ok', true, 'idempotent', true);
  end if;
  if v_row.status is distinct from 'pending' then
    raise exception 'Achat non payable';
  end if;

  v_total := v_row.stars + v_row.bonus_stars;
  perform public.stars_credit(
    v_row.owner_type, v_row.owner_id, v_total,
    'Achat pack ' || coalesce(v_row.package_id, ''),
    'purchase', v_row.id::text,
    'purchase:' || v_row.id::text
  );

  update public.stars_purchases
  set status = 'paid', paid_at = now(), updated_at = now()
  where id = p_purchase_id;

  return jsonb_build_object('ok', true, 'stars', v_total);
end;
$$;

create or replace function public.stars_fail_purchase(p_purchase_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' and not public.moxt_stars_is_staff() then
    raise exception 'Non autorisé';
  end if;
  update public.stars_purchases
  set status = 'failed', updated_at = now()
  where id = p_purchase_id and status = 'pending';
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
begin
  perform public.moxt_stars_assert_owner(p_owner_type, v_owner_id);
  return query
    select *
    from public.stars_transactions
    where owner_type = p_owner_type and owner_id = v_owner_id
    order by created_at desc
    limit greatest(1, least(coalesce(p_limit, 30), 100))
    offset greatest(0, coalesce(p_offset, 0));
end;
$$;

create or replace function public.stars_admin_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sold integer;
  v_used integer;
  v_gifted integer;
  v_revenue integer;
  v_pending integer;
  v_failed integer;
  v_top jsonb;
begin
  if not public.moxt_stars_is_staff() then
    raise exception 'Réservé aux administrateurs';
  end if;

  select coalesce(sum(stars + bonus_stars) filter (where status = 'paid'), 0),
         coalesce(sum(price_rub) filter (where status = 'paid'), 0),
         count(*) filter (where status = 'pending'),
         count(*) filter (where status = 'failed')
  into v_sold, v_revenue, v_pending, v_failed
  from public.stars_purchases;

  select coalesce(sum(amount) filter (where kind = 'debit'), 0),
         coalesce(sum(amount) filter (where kind = 'credit' and star_type = 'bonus'), 0)
  into v_used, v_gifted
  from public.stars_transactions;

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  into v_top
  from (
    select category, sum(amount) as consumed
    from public.stars_transactions
    where kind = 'debit' and category is not null
    group by category
    order by sum(amount) desc
    limit 8
  ) t;

  return jsonb_build_object(
    'sold', coalesce(v_sold, 0),
    'used', coalesce(v_used, 0),
    'gifted', coalesce(v_gifted, 0),
    'revenueRub', coalesce(v_revenue, 0),
    'pendingPurchases', coalesce(v_pending, 0),
    'failedPurchases', coalesce(v_failed, 0),
    'topCategories', coalesce(v_top, '[]'::jsonb)
  );
end;
$$;

create or replace function public.stars_admin_suspects()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_spikes jsonb;
  v_fails jsonb;
begin
  if not public.moxt_stars_is_staff() then
    raise exception 'Réservé aux administrateurs';
  end if;

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  into v_spikes
  from (
    select owner_type, owner_id, sum(amount) as debit_24h, count(*) as ops
    from public.stars_transactions
    where kind = 'debit' and created_at > now() - interval '24 hours'
    group by owner_type, owner_id
    having sum(amount) >= 50 or count(*) >= 20
    order by sum(amount) desc
    limit 20
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  into v_fails
  from (
    select owner_type, owner_id, count(*) as failed
    from public.stars_purchases
    where status = 'failed' and created_at > now() - interval '7 days'
    group by owner_type, owner_id
    having count(*) >= 3
    limit 20
  ) t;

  return jsonb_build_object('spikes', v_spikes, 'failedPurchases', v_fails);
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
    perform public.moxt_stars_ensure_bonus(rec.owner_type, rec.owner_id, cat,
      case when rec.owner_type = 'business' then 'business' else 'personal' end,
      false)
    from unnest(array['marketplace', 'jobs', 'events', 'parcel', 'video', 'status']) as cat;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

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
    perform public.moxt_stars_ensure_bonus('user', rec.owner_id, cat, 'personal', true)
    from unnest(array['marketplace', 'jobs', 'events', 'parcel', 'video', 'status']) as cat;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

grant execute on function public.stars_get_balance(text, text) to authenticated;
grant execute on function public.stars_quote(text, text, text, text) to authenticated;
grant execute on function public.stars_consume(text, text, text, text, text, text, text) to authenticated;
grant execute on function public.stars_refund_failed_publish(text, text, text) to authenticated;
grant execute on function public.stars_create_purchase(text, text, text, text) to authenticated;
grant execute on function public.stars_list_transactions(text, text, integer, integer) to authenticated;
grant execute on function public.stars_credit(text, text, integer, text, text, text, text) to authenticated;
grant execute on function public.stars_admin_adjust(text, text, integer, text) to authenticated;
grant execute on function public.stars_admin_update_config(jsonb) to authenticated;
grant execute on function public.stars_fulfill_purchase(uuid) to authenticated;
grant execute on function public.stars_fail_purchase(uuid) to authenticated;
grant execute on function public.stars_admin_overview() to authenticated;
grant execute on function public.stars_admin_suspects() to authenticated;
grant execute on function public.stars_seed_bonus_prorata() to authenticated;
grant execute on function public.stars_monthly_reset() to authenticated;
grant execute on function public.moxt_stars_is_staff() to authenticated;
grant execute on function public.moxt_stars_is_enforced(text) to authenticated;

create extension if not exists pg_cron;

select cron.schedule(
  'moxt-stars-monthly-reset',
  '5 0 1 * *',
  $$select public.stars_monthly_reset()$$
)
where not exists (
  select 1 from cron.job where jobname = 'moxt-stars-monthly-reset'
);

notify pgrst, 'reload schema';
