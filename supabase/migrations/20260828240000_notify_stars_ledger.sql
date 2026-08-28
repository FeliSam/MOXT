-- Notify the wallet owner on every Stars ledger movement (purchase, credit,
-- referral, gift, spend). Does not backfill existing rows. Stable ids match the
-- client (`NOT-STARS-` + idempotency_key or transaction id).

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

drop trigger if exists stars_transactions_notify_ledger on public.stars_transactions;
create trigger stars_transactions_notify_ledger
  after insert on public.stars_transactions
  for each row
  execute function public.moxt_notify_stars_ledger();

revoke all on function public.moxt_notify_stars_ledger() from public, anon, authenticated;

notify pgrst, 'reload schema';
