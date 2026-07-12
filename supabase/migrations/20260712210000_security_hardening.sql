-- Durcissement sécurité : colonnes privilégiées profiles, finance, vérification, litiges, parrainage

-- ---------------------------------------------------------------------------
-- 1. Garde profiles (role, status, phone_verified, referral_code)
-- ---------------------------------------------------------------------------

create or replace function private.moxt_profiles_privilege_guard()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_phone_confirmed boolean;
begin
  if tg_op = 'INSERT' then
    if not public.moxt_is_admin() then
      new.role := 'user';
      new.status := coalesce(nullif(new.status, ''), 'active');
      if new.status = 'verified' then
        new.status := 'active';
      end if;
      new.phone_verified := false;
      new.phone_verified_at := null;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and not public.moxt_is_admin() then
    new.role := old.role;
    new.status := old.status;
    new.referral_code := old.referral_code;

    if new.phone_verified is distinct from old.phone_verified then
      if new.phone_verified = true then
        select u.phone_confirmed_at is not null
        into v_phone_confirmed
        from auth.users u
        where u.id = new.id;

        if coalesce(v_phone_confirmed, false) is not true then
          new.phone_verified := old.phone_verified;
          new.phone_verified_at := old.phone_verified_at;
        end if;
      else
        new.phone_verified := old.phone_verified;
        new.phone_verified_at := old.phone_verified_at;
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.moxt_profiles_privilege_guard() from public, anon, authenticated;

drop trigger if exists moxt_profiles_privilege_guard on public.profiles;
create trigger moxt_profiles_privilege_guard
  before insert or update on public.profiles
  for each row
  execute function private.moxt_profiles_privilege_guard();

-- ---------------------------------------------------------------------------
-- 2. verification_requests — utilisateur : lecture + création seulement
-- ---------------------------------------------------------------------------

drop policy if exists "MOXT users manage own verification" on public.verification_requests;

drop policy if exists "MOXT users insert own verification" on public.verification_requests;
create policy "MOXT users insert own verification"
  on public.verification_requests
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status in ('pending', 'pending_review', 'submitted')
  );

drop policy if exists "MOXT users read own verification" on public.verification_requests;
create policy "MOXT users read own verification"
  on public.verification_requests
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.moxt_is_admin()
  );

revoke delete on table public.verification_requests from authenticated;

-- ---------------------------------------------------------------------------
-- 3. Finance — lecture seule ; écriture simulation=true uniquement
-- ---------------------------------------------------------------------------

drop policy if exists "MOXT users manage own payments" on public.payments;
drop policy if exists "MOXT users read own payments" on public.payments;
create policy "MOXT users read own payments"
  on public.payments
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "MOXT users insert simulated payments" on public.payments;
create policy "MOXT users insert simulated payments"
  on public.payments
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and simulation = true
  );

drop policy if exists "MOXT users update simulated payments" on public.payments;
create policy "MOXT users update simulated payments"
  on public.payments
  for update
  to authenticated
  using (user_id = (select auth.uid()) and simulation = true)
  with check (user_id = (select auth.uid()) and simulation = true);

drop policy if exists "MOXT users manage own wallet entries" on public.wallet_entries;
drop policy if exists "MOXT users read own wallet entries" on public.wallet_entries;
create policy "MOXT users read own wallet entries"
  on public.wallet_entries
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "MOXT users insert simulated wallet entries" on public.wallet_entries;
create policy "MOXT users insert simulated wallet entries"
  on public.wallet_entries
  for insert
  to authenticated
  with check (user_id = (select auth.uid()) and simulation = true);

drop policy if exists "MOXT users update simulated wallet entries" on public.wallet_entries;
create policy "MOXT users update simulated wallet entries"
  on public.wallet_entries
  for update
  to authenticated
  using (user_id = (select auth.uid()) and simulation = true)
  with check (user_id = (select auth.uid()) and simulation = true);

drop policy if exists "MOXT users manage own receipts" on public.receipts;
drop policy if exists "MOXT users read own receipts" on public.receipts;
create policy "MOXT users read own receipts"
  on public.receipts
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "MOXT users insert simulated receipts" on public.receipts;
create policy "MOXT users insert simulated receipts"
  on public.receipts
  for insert
  to authenticated
  with check (user_id = (select auth.uid()) and simulation = true);

drop policy if exists "MOXT users update simulated receipts" on public.receipts;
create policy "MOXT users update simulated receipts"
  on public.receipts
  for update
  to authenticated
  using (user_id = (select auth.uid()) and simulation = true)
  with check (user_id = (select auth.uid()) and simulation = true);

revoke delete on table public.payments from authenticated;
revoke delete on table public.wallet_entries from authenticated;
revoke delete on table public.receipts from authenticated;

create or replace function private.moxt_finance_simulation_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') and coalesce(new.simulation, false) is not true then
    if not public.moxt_is_admin() then
      raise exception 'MOXT_FINANCE_WRITE_DENIED';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.moxt_finance_simulation_guard() from public, anon, authenticated;

drop trigger if exists moxt_payments_simulation_guard on public.payments;
create trigger moxt_payments_simulation_guard
  before insert or update on public.payments
  for each row execute function private.moxt_finance_simulation_guard();

drop trigger if exists moxt_wallet_entries_simulation_guard on public.wallet_entries;
create trigger moxt_wallet_entries_simulation_guard
  before insert or update on public.wallet_entries
  for each row execute function private.moxt_finance_simulation_guard();

drop trigger if exists moxt_receipts_simulation_guard on public.receipts;
create trigger moxt_receipts_simulation_guard
  before insert or update on public.receipts
  for each row execute function private.moxt_finance_simulation_guard();

-- ---------------------------------------------------------------------------
-- 4. Litiges — seul le plaignant peut modifier (pas la cible) ; statut admin
-- ---------------------------------------------------------------------------

create or replace function private.moxt_disputes_update_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and not public.moxt_is_admin() then
    if old.reporter_id is distinct from auth.uid() then
      raise exception 'MOXT_DISPUTE_UPDATE_DENIED';
    end if;
    new.status := old.status;
    new.updated_by := old.updated_by;
  end if;
  return new;
end;
$$;

revoke all on function private.moxt_disputes_update_guard() from public, anon, authenticated;

drop trigger if exists moxt_disputes_update_guard on public.disputes;
create trigger moxt_disputes_update_guard
  before update on public.disputes
  for each row execute function private.moxt_disputes_update_guard();

drop policy if exists "MOXT update disputes" on public.disputes;

drop policy if exists "MOXT reporter update disputes" on public.disputes;
create policy "MOXT reporter update disputes"
  on public.disputes
  for update
  to authenticated
  using (reporter_id = (select auth.uid()))
  with check (reporter_id = (select auth.uid()));

drop policy if exists "MOXT admin update disputes" on public.disputes;
create policy "MOXT admin update disputes"
  on public.disputes
  for update
  to authenticated
  using (public.moxt_is_admin())
  with check (public.moxt_is_admin());

-- ---------------------------------------------------------------------------
-- 5. Parrainage — téléphone vérifié requis
-- ---------------------------------------------------------------------------

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

  insert into public.referrals (
    id,
    referrer_id,
    referred_user_id,
    referred_user_name,
    status
  )
  values (
    'REF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
    v_referrer_id,
    auth.uid(),
    coalesce(v_referred_name, 'Utilisateur'),
    'confirmed'
  )
  on conflict (referred_user_id) do nothing;

  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Énumération identité — masquer la raison pour les appels anonymes
-- ---------------------------------------------------------------------------

create or replace function public.moxt_check_identity_available(
  p_kind text,
  p_value text,
  p_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_value text := public.moxt_normalize_identity_value(p_kind, p_value);
  v_total integer;
  v_live_owner uuid;
  v_available boolean := true;
  v_reason text := null;
begin
  if v_value = '' then
    return jsonb_build_object('available', true, 'reason', null);
  end if;

  perform public.moxt_cleanup_stale_identity_slots(p_kind, v_value);

  if p_user_id is not null and exists (
    select 1
    from public.account_identity_history h
    where h.identity_kind = p_kind
      and h.identity_value = v_value
      and h.user_id = p_user_id
      and h.released_at is null
  ) then
    return jsonb_build_object('available', true, 'reason', null);
  end if;

  v_live_owner := public.moxt_find_live_identity_owner(p_kind, v_value);
  if v_live_owner is not null and (p_user_id is null or v_live_owner <> p_user_id) then
    v_available := false;
    v_reason := 'active';
  end if;

  if v_available then
    select count(*)::integer
    into v_total
    from public.account_identity_history h
    where h.identity_kind = p_kind
      and h.identity_value = v_value;

    if v_total >= 2 then
      v_available := false;
      v_reason := 'limit';
    end if;
  end if;

  if auth.uid() is null and not v_available then
    return jsonb_build_object('available', false, 'reason', 'unavailable');
  end if;

  return jsonb_build_object('available', v_available, 'reason', v_reason);
end;
$$;

revoke all on function public.moxt_check_identity_available(text, text, uuid) from public;
grant execute on function public.moxt_check_identity_available(text, text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
