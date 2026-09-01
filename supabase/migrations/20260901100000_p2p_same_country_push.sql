-- P2P : notif + push aux utilisateurs du même pays que l'offre (receiveCountry).
-- Le message inclut montant, paire de devises et taux proposé.

create or replace function public.moxt_notify_users_by_country(
  p_title text,
  p_message text,
  p_type text default 'publication',
  p_link text default '/',
  p_priority text default 'normal',
  p_dedupe_key text default null,
  p_country text default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_key text := coalesce(nullif(trim(p_dedupe_key), ''), replace(gen_random_uuid()::text, '-', ''));
  v_link text := coalesce(nullif(trim(p_link), ''), '/');
  v_title text := left(trim(coalesce(p_title, '')), 200);
  v_message text := left(coalesce(p_message, ''), 500);
  v_type text := coalesce(nullif(trim(p_type), ''), 'publication');
  v_priority text := case
    when p_priority in ('high', 'normal', 'low') then p_priority
    else 'normal'
  end;
  v_country text := upper(nullif(trim(coalesce(p_country, '')), ''));
  v_recent int;
  v_count int := 0;
begin
  if v_actor is null then
    raise exception 'Authentification requise.';
  end if;

  if v_title = '' then
    raise exception 'title required';
  end if;

  if v_country is null or v_country = '' then
    return 0;
  end if;

  if v_link ~* '^https?://[^/]+(/.*)$' then
    v_link := substring(v_link from '^https?://[^/]+(/.*)$');
  end if;
  if left(v_link, 1) <> '/' or left(v_link, 2) = '//' or v_link ~* '^(javascript:|data:)' then
    v_link := '/';
  end if;

  if not public.moxt_is_admin() then
    select count(*)::int into v_recent
    from public.moxt_publication_broadcast_log
    where actor_id = v_actor
      and created_at > now() - interval '1 hour';

    if v_recent >= 40 then
      return 0;
    end if;

    insert into public.moxt_publication_broadcast_log (actor_id) values (v_actor);
  end if;

  -- Push activé : pas de moxt.skip_push pour ce fan-out ciblé.

  insert into public.notifications (
    id, user_id, title, message, type, link, priority,
    read, archived, created_at, updated_at
  )
  select
    'NOT-CTY-' || left(v_key, 24) || '-' || left(replace(p.id::text, '-', ''), 12),
    p.id,
    v_title,
    v_message,
    v_type,
    v_link,
    v_priority,
    false,
    false,
    now(),
    now()
  from public.profiles p
  where p.id is distinct from v_actor
    and coalesce(p.status, 'active') not in (
      'suspended', 'banned', 'blocked', 'disabled', 'pending_deletion'
    )
    and upper(coalesce(nullif(trim(p.origin_country), ''), nullif(trim(p.country), ''), '')) = v_country
  on conflict (id) do update set
    title = excluded.title,
    message = excluded.message,
    link = excluded.link,
    type = excluded.type,
    priority = excluded.priority,
    read = false,
    archived = false,
    updated_at = now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.moxt_notify_p2p_offer_available()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_name text;
  v_title text;
  v_message text;
  v_amount text;
  v_rate text;
  v_method text;
  v_country text;
begin
  if new.status is distinct from 'active' then
    return new;
  end if;

  if tg_op = 'UPDATE' and coalesce(old.status, '') = 'active' then
    return new;
  end if;

  v_country := upper(nullif(trim(coalesce(
    new.payload ->> 'receiveCountry',
    new.payload ->> 'originCountry',
    ''
  )), ''));

  if v_country is null and new.owner_id is not null then
    select upper(coalesce(
      nullif(trim(p.origin_country), ''),
      nullif(trim(p.country), ''),
      ''
    ))
    into v_country
    from public.profiles p
    where p.id = new.owner_id;
  end if;

  if v_country is null or v_country = '' then
    return new;
  end if;

  v_owner_name := nullif(trim(coalesce(new.owner_name, '')), '');
  if v_owner_name is null and new.owner_id is not null then
    select nullif(
      trim(concat_ws(' ', nullif(trim(p.first_name), ''), nullif(trim(p.last_name), ''))),
      ''
    )
    into v_owner_name
    from public.profiles p
    where p.id = new.owner_id;
  end if;
  v_owner_name := coalesce(v_owner_name, 'MOXT');

  v_amount := trim(to_char(coalesce(new.amount, 0), 'FM999999999990.00'));
  v_rate := case
    when new.rate is null then '—'
    else trim(to_char(new.rate, 'FM999999990.##########'))
  end;
  v_method := coalesce(
    nullif(trim(coalesce(new.payload ->> 'method', '')), ''),
    '—'
  );

  v_title := left(v_owner_name || ' — Nouvelle offre P2P', 200);
  v_message := left(
    v_amount || ' ' || coalesce(new.from_currency, '') || ' → ' || coalesce(new.to_currency, '')
      || ' · taux ' || v_rate || ' · ' || v_method,
    500
  );

  perform public.moxt_notify_users_by_country(
    v_title,
    v_message,
    'p2p',
    '/p2p/' || new.id,
    'high',
    'p2p-' || new.id,
    v_country
  );

  return new;
exception
  when others then
    raise warning 'moxt_notify_p2p_offer_available: %', sqlerrm;
    return new;
end;
$$;

revoke all on function public.moxt_notify_users_by_country(text, text, text, text, text, text, text) from public;
grant execute on function public.moxt_notify_users_by_country(text, text, text, text, text, text, text) to authenticated;

revoke all on function public.moxt_notify_p2p_offer_available() from public;

create index if not exists profiles_origin_country_idx
  on public.profiles (upper(coalesce(nullif(trim(origin_country), ''), nullif(trim(country), ''))));

notify pgrst, 'reload schema';
