-- Durcissement (Supabase advisor, WARN "function search_path mutable") : ces
-- 7 fonctions n'avaient pas de search_path épinglé. Sans ça, un search_path
-- de session manipulé pourrait faire résoudre un identifiant non qualifié
-- (type, opérateur…) vers un objet différent de celui attendu. Aucune ne
-- change de comportement — même corps, juste le SET search_path en plus.

create or replace function public.moxt_normalize_ru_phone(p_value text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_trimmed text := trim(coalesce(p_value, ''));
  v_has_plus boolean := v_trimmed like '+%';
  v_digits text := regexp_replace(v_trimmed, '\D', '', 'g');
begin
  if v_digits = '' then
    return '';
  end if;
  if v_digits ~ '^8\d{10}$' then
    return '+7' || substring(v_digits from 2);
  end if;
  if v_digits ~ '^7\d{10}$' then
    return '+' || v_digits;
  end if;
  if v_has_plus then
    return '+' || v_digits;
  end if;
  return v_digits;
end;
$$;

create or replace function public.moxt_uint32_to_base36(n bigint)
returns text
language plpgsql
immutable
set search_path = public
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
set search_path = public
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

create or replace function public.moxt_normalize_identity_value(p_kind text, p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when p_kind = 'email' then lower(trim(coalesce(p_value, '')))
    when p_kind = 'phone' then public.moxt_normalize_ru_phone(p_value)
    else trim(coalesce(p_value, ''))
  end;
$$;

create or replace function public.moxt_touch_device_subscription_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.set_profile_referral_code()
returns trigger
language plpgsql
set search_path = private, public
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

create or replace function private.user_participates_in_conversation(participant_ids jsonb)
returns boolean
language sql
stable
set search_path = private, public
as $$
  select participant_ids @> jsonb_build_array((select auth.uid())::text);
$$;

notify pgrst, 'reload schema';
