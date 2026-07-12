-- Limite à 2 comptes par e-mail ou téléphone (historique conservé après suppression).
-- Après suppression du 1er compte, l'utilisateur peut se réinscrire une fois avec les mêmes identifiants.

create table if not exists public.account_identity_history (
  id bigint generated always as identity primary key,
  identity_kind text not null check (identity_kind in ('email', 'phone')),
  identity_value text not null check (identity_value <> ''),
  user_id uuid not null,
  registered_at timestamptz not null default now(),
  released_at timestamptz
);

create index if not exists account_identity_history_lookup_idx
  on public.account_identity_history (identity_kind, identity_value);

create index if not exists account_identity_history_user_idx
  on public.account_identity_history (user_id, registered_at desc);

create unique index if not exists account_identity_history_active_uidx
  on public.account_identity_history (identity_kind, identity_value)
  where released_at is null;

alter table public.account_identity_history enable row level security;

create or replace function public.moxt_normalize_ru_phone(p_value text)
returns text
language plpgsql
immutable
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
  if v_has_plus then
    return '+' || v_digits;
  end if;
  return v_digits;
end;
$$;

create or replace function public.moxt_normalize_identity_value(p_kind text, p_value text)
returns text
language sql
immutable
as $$
  select case
    when p_kind = 'email' then lower(trim(coalesce(p_value, '')))
    when p_kind = 'phone' then public.moxt_normalize_ru_phone(p_value)
    else trim(coalesce(p_value, ''))
  end;
$$;

create or replace function public.moxt_assert_identity_available(
  p_kind text,
  p_value text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value text := public.moxt_normalize_identity_value(p_kind, p_value);
  v_total integer;
  v_active_other uuid;
begin
  if v_value = '' then
    return;
  end if;

  if exists (
    select 1
    from public.account_identity_history h
    where h.identity_kind = p_kind
      and h.identity_value = v_value
      and h.user_id = p_user_id
      and h.released_at is null
  ) then
    return;
  end if;

  select h.user_id
  into v_active_other
  from public.account_identity_history h
  where h.identity_kind = p_kind
    and h.identity_value = v_value
    and h.released_at is null
  limit 1;

  if v_active_other is not null and v_active_other <> p_user_id then
    raise exception 'MOXT_IDENTITY_ACTIVE';
  end if;

  select count(*)::integer
  into v_total
  from public.account_identity_history h
  where h.identity_kind = p_kind
    and h.identity_value = v_value;

  if v_total >= 2 then
    raise exception 'MOXT_IDENTITY_LIMIT_REACHED';
  end if;
end;
$$;

create or replace function public.moxt_register_identity_slot(
  p_kind text,
  p_value text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value text := public.moxt_normalize_identity_value(p_kind, p_value);
begin
  if v_value = '' then
    return;
  end if;

  if exists (
    select 1
    from public.account_identity_history h
    where h.identity_kind = p_kind
      and h.identity_value = v_value
      and h.user_id = p_user_id
      and h.released_at is null
  ) then
    return;
  end if;

  perform public.moxt_assert_identity_available(p_kind, v_value, p_user_id);

  insert into public.account_identity_history (identity_kind, identity_value, user_id)
  values (p_kind, v_value, p_user_id);
end;
$$;

create or replace function public.moxt_release_identity_slot(
  p_kind text,
  p_value text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value text := public.moxt_normalize_identity_value(p_kind, p_value);
begin
  if v_value = '' then
    return;
  end if;

  update public.account_identity_history h
  set released_at = coalesce(h.released_at, now())
  where h.identity_kind = p_kind
    and h.identity_value = v_value
    and h.user_id = p_user_id
    and h.released_at is null;
end;
$$;

create or replace function public.moxt_release_identity_slots(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.account_identity_history h
  set released_at = coalesce(h.released_at, now())
  where h.user_id = p_user_id
    and h.released_at is null;
end;
$$;

create or replace function private.moxt_auth_user_identity_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(new.email, '') <> '' then
      perform public.moxt_assert_identity_available('email', new.email, new.id);
    end if;
    if coalesce(new.phone, '') <> '' then
      perform public.moxt_assert_identity_available('phone', new.phone, new.id);
    end if;
  elsif tg_op = 'UPDATE' then
    if new.email is distinct from old.email and coalesce(new.email, '') <> '' then
      perform public.moxt_assert_identity_available('email', new.email, new.id);
    end if;
    if new.phone is distinct from old.phone and coalesce(new.phone, '') <> '' then
      perform public.moxt_assert_identity_available('phone', new.phone, new.id);
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.moxt_auth_user_identity_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.moxt_release_identity_slots(old.id);
    return old;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(new.email, '') <> '' then
      perform public.moxt_register_identity_slot('email', new.email, new.id);
    end if;
    if coalesce(new.phone, '') <> '' then
      perform public.moxt_register_identity_slot('phone', new.phone, new.id);
    end if;
    return new;
  end if;

  if new.email is distinct from old.email then
    if coalesce(old.email, '') <> '' then
      perform public.moxt_release_identity_slot('email', old.email, old.id);
    end if;
    if coalesce(new.email, '') <> '' then
      perform public.moxt_register_identity_slot('email', new.email, new.id);
    end if;
  end if;

  if new.phone is distinct from old.phone then
    if coalesce(old.phone, '') <> '' then
      perform public.moxt_release_identity_slot('phone', old.phone, old.id);
    end if;
    if coalesce(new.phone, '') <> '' then
      perform public.moxt_register_identity_slot('phone', new.phone, new.id);
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.moxt_profiles_phone_identity_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and coalesce(new.phone_verified, false) = true
    and coalesce(old.phone_verified, false) is distinct from true
    and coalesce(new.phone, '') <> '' then
    perform public.moxt_assert_identity_available('phone', new.phone, new.id);
    perform public.moxt_register_identity_slot('phone', new.phone, new.id);
  elsif tg_op = 'INSERT'
    and coalesce(new.phone_verified, false) = true
    and coalesce(new.phone, '') <> '' then
    perform public.moxt_assert_identity_available('phone', new.phone, new.id);
    perform public.moxt_register_identity_slot('phone', new.phone, new.id);
  end if;

  if tg_op = 'UPDATE'
    and coalesce(old.phone_verified, false) = true
    and coalesce(new.phone_verified, false) is distinct from true
    and coalesce(old.phone, '') <> '' then
    perform public.moxt_release_identity_slot('phone', old.phone, old.id);
  end if;

  if tg_op = 'UPDATE'
    and coalesce(new.phone_verified, false) = true
    and new.phone is distinct from old.phone
    and coalesce(old.phone, '') <> '' then
    perform public.moxt_release_identity_slot('phone', old.phone, old.id);
    perform public.moxt_register_identity_slot('phone', new.phone, new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists moxt_auth_user_identity_guard on auth.users;
create trigger moxt_auth_user_identity_guard
  before insert or update of email, phone on auth.users
  for each row
  execute function private.moxt_auth_user_identity_guard();

drop trigger if exists moxt_auth_user_identity_sync on auth.users;
create trigger moxt_auth_user_identity_sync
  after insert or update of email, phone on auth.users
  for each row
  execute function private.moxt_auth_user_identity_sync();

drop trigger if exists moxt_auth_user_identity_release on auth.users;
create trigger moxt_auth_user_identity_release
  before delete on auth.users
  for each row
  execute function private.moxt_auth_user_identity_sync();

drop trigger if exists moxt_profiles_phone_identity_sync on public.profiles;
create trigger moxt_profiles_phone_identity_sync
  after insert or update of phone, phone_verified on public.profiles
  for each row
  execute function private.moxt_profiles_phone_identity_sync();

-- Comptes déjà existants : enregistrer les emplacements actifs sans bloquer.
insert into public.account_identity_history (identity_kind, identity_value, user_id, registered_at)
select distinct
  'email',
  public.moxt_normalize_identity_value('email', u.email),
  u.id,
  coalesce(u.created_at, now())
from auth.users u
where coalesce(u.email, '') <> ''
  and not exists (
    select 1
    from public.account_identity_history h
    where h.identity_kind = 'email'
      and h.identity_value = public.moxt_normalize_identity_value('email', u.email)
      and h.user_id = u.id
      and h.released_at is null
  );

insert into public.account_identity_history (identity_kind, identity_value, user_id, registered_at)
select distinct
  'phone',
  public.moxt_normalize_identity_value('phone', coalesce(nullif(u.phone, ''), p.phone)),
  u.id,
  coalesce(p.phone_verified_at, u.created_at, now())
from auth.users u
join public.profiles p on p.id = u.id
where coalesce(p.phone_verified, false) = true
  and public.moxt_normalize_identity_value('phone', coalesce(nullif(u.phone, ''), p.phone)) <> ''
  and not exists (
    select 1
    from public.account_identity_history h
    where h.identity_kind = 'phone'
      and h.identity_value = public.moxt_normalize_identity_value(
        'phone',
        coalesce(nullif(u.phone, ''), p.phone)
      )
      and h.user_id = u.id
      and h.released_at is null
  );

notify pgrst, 'reload schema';
