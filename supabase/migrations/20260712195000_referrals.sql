-- Parrainage : code unique par profil + suivi des filleuls

create or replace function public.moxt_uint32_to_base36(n bigint)
returns text
language plpgsql
immutable
as $$
declare
  digits constant text := '0123456789abcdefghijklmnopqrstuvwxyz';
  v bigint := n & 4294967295;
  result text := '';
begin
  if v = 0 then
    return '0';
  end if;
  while v > 0 loop
    result := substr(digits, (v % 36)::int + 1, 1) || result;
    v := v / 36;
  end loop;
  return result;
end;
$$;

create or replace function public.moxt_referral_code_from_id(p_id uuid)
returns text
language plpgsql
immutable
as $$
declare
  base text := coalesce(p_id::text, 'MOXT');
  hash bigint := 0;
  i int;
  ch int;
  raw36 text;
  suffix text;
begin
  for i in 1..length(base) loop
    ch := ascii(substr(base, i, 1));
    hash := (hash * 31 + ch) & 4294967295;
  end loop;
  raw36 := public.moxt_uint32_to_base36(hash);
  if length(raw36) >= 6 then
    suffix := substr(raw36, 1, 6);
  else
    suffix := lpad(raw36, 6, '0');
  end if;
  return 'MOXT-' || upper(suffix);
end;
$$;

alter table public.profiles
  add column if not exists referral_code text;

create unique index if not exists profiles_referral_code_uidx
  on public.profiles (referral_code)
  where referral_code is not null;

update public.profiles
set referral_code = public.moxt_referral_code_from_id(id)
where referral_code is null;

create or replace function private.set_profile_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null or btrim(new.referral_code) = '' then
    new.referral_code := public.moxt_referral_code_from_id(new.id);
  else
    new.referral_code := upper(btrim(new.referral_code));
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_referral_code on public.profiles;
create trigger profiles_set_referral_code
before insert on public.profiles
for each row execute function private.set_profile_referral_code();

create table if not exists public.referrals (
  id text primary key,
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_user_id uuid not null references public.profiles (id) on delete cascade,
  referred_user_name text,
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'rewarded')),
  reward_amount numeric,
  created_at timestamptz not null default now(),
  constraint referrals_referred_user_unique unique (referred_user_id)
);

create index if not exists referrals_referrer_created_idx
  on public.referrals (referrer_id, created_at desc);

alter table public.referrals enable row level security;

drop policy if exists "MOXT referrer read own referrals" on public.referrals;
create policy "MOXT referrer read own referrals"
  on public.referrals
  for select
  to authenticated
  using (referrer_id = auth.uid());

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
  if v_normalized_code = '' then
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

revoke all on function public.moxt_apply_referral(text) from public;
grant execute on function public.moxt_apply_referral(text) to authenticated;

notify pgrst, 'reload schema';
