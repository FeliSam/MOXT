-- Align superadmin transfer notify statuses with real transfers.status values.

create or replace function public.moxt_notify_superadmins_transfer_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_record record;
  v_title text;
  v_message text;
  v_biz text;
  v_amount text;
  v_status_label text;
  v_link text;
  v_notif_id text;
  v_priority text := 'normal';
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;

  if tg_op = 'INSERT' and new.status in ('cancelled', 'expired', 'business_declined') then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and new.status not in (
       'pending_business_acceptance',
       'pending_payment',
       'payment_declared',
       'payment_received',
       'processing',
       'paid_out',
       'completed',
       'cancelled',
       'expired',
       'business_declined'
     ) then
    return new;
  end if;

  v_biz := coalesce(nullif(trim(new.exchanger->>'name'), ''), 'échangeur');
  v_amount := trim(to_char(coalesce(new.amount, 0), 'FM999999999990.00'));
  v_link := '/transfers/' || coalesce(new.id, '');

  v_status_label := case new.status
    when 'pending_business_acceptance' then 'en attente d’acceptation'
    when 'pending_payment' then 'en attente de paiement'
    when 'payment_declared' then 'paiement déclaré'
    when 'payment_received' then 'fonds reçus'
    when 'processing' then 'en traitement'
    when 'paid_out' then 'versé'
    when 'completed' then 'terminé'
    when 'cancelled' then 'annulé'
    when 'expired' then 'expiré'
    when 'business_declined' then 'refusé'
    else coalesce(new.status, 'en cours')
  end;

  if tg_op = 'INSERT' then
    v_title := 'Nouveau transfert en cours';
    v_message :=
      'Transfert '
      || coalesce(new.id, '')
      || ' · '
      || v_amount
      || ' via '
      || left(v_biz, 80)
      || ' ('
      || v_status_label
      || ').';
    v_notif_id := 'NOT-TRF-NEW-' || coalesce(new.id, replace(gen_random_uuid()::text, '-', ''));
  elsif new.status in ('cancelled', 'expired', 'business_declined') then
    v_title := 'Transfert interrompu';
    v_message :=
      'Transfert '
      || coalesce(new.id, '')
      || ' → '
      || v_status_label
      || ' ('
      || left(v_biz, 80)
      || ').';
    v_priority := 'high';
    v_notif_id := 'NOT-TRF-STOP-' || coalesce(new.id, '') || '-' || coalesce(new.status, 'x');
  elsif new.status = 'completed' then
    v_title := 'Transfert terminé';
    v_message :=
      'Transfert '
      || coalesce(new.id, '')
      || ' · '
      || v_amount
      || ' · '
      || left(v_biz, 60)
      || '.';
    v_notif_id := 'NOT-TRF-DONE-' || coalesce(new.id, '');
  else
    v_title := 'Transfert en cours';
    v_message :=
      'Transfert '
      || coalesce(new.id, '')
      || ' · '
      || v_amount
      || ' · '
      || v_status_label
      || ' · '
      || left(v_biz, 60)
      || '.';
    v_notif_id := 'NOT-TRF-' || upper(replace(coalesce(new.status, 'UPD'), '_', '')) || '-' || coalesce(new.id, '');
  end if;

  for admin_record in
    select id
    from public.profiles
    where role = 'superadmin'
      and coalesce(status, 'active') not in (
        'suspended', 'banned', 'blocked', 'disabled', 'pending_deletion'
      )
  loop
    insert into public.notifications (
      id,
      user_id,
      title,
      message,
      type,
      link,
      priority,
      read,
      archived,
      created_at,
      updated_at
    ) values (
      left(v_notif_id, 48) || '-' || left(replace(admin_record.id::text, '-', ''), 12),
      admin_record.id,
      left(v_title, 200),
      left(v_message, 500),
      'transfer',
      v_link,
      v_priority,
      false,
      false,
      now(),
      now()
    )
    on conflict (id) do update
      set
        title = excluded.title,
        message = excluded.message,
        link = excluded.link,
        priority = excluded.priority,
        read = false,
        archived = false,
        updated_at = now();
  end loop;

  return new;
end;
$$;

notify pgrst, 'reload schema';
