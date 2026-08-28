-- Notifie tous les utilisateurs actifs dès qu'une offre P2P devient disponible
-- (création status=active ou passage archived/accepted → active).
-- Dedupe alignée sur le client : p2p-{offerId}

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
begin
  if new.status is distinct from 'active' then
    return new;
  end if;

  -- Pas de re-notification pour une simple édition d'offre déjà active
  if tg_op = 'UPDATE' and coalesce(old.status, '') = 'active' then
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

  perform public.moxt_notify_all_users(
    v_title,
    v_message,
    'p2p',
    '/p2p/' || new.id,
    'high',
    'p2p-' || new.id
  );

  return new;
exception
  when others then
    -- Ne bloque jamais la publication de l'offre si le fan-out échoue
    raise warning 'moxt_notify_p2p_offer_available: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists moxt_p2p_offer_notify_available on public.p2p_offers;
create trigger moxt_p2p_offer_notify_available
  after insert or update of status on public.p2p_offers
  for each row
  execute function public.moxt_notify_p2p_offer_available();

revoke all on function public.moxt_notify_p2p_offer_available() from public;

notify pgrst, 'reload schema';
