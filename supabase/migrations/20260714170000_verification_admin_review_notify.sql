-- Admin KYC review: review_note + notify admins (in-app + push via notifications_dispatch_push)

alter table public.verification_requests
  add column if not exists review_note text not null default '';

-- Notifier les admins lorsqu'une demande de vérification est soumise (côté serveur).
create or replace function public.moxt_notify_admins_verification_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_record record;
  requester_name text;
  level_label text;
  notif_id text;
begin
  if new.status is distinct from 'pending_review' then
    return new;
  end if;

  -- UPDATE de dossier déjà en attente : ne re-notifier que si le niveau ou les docs changent
  if tg_op = 'UPDATE' then
    if old.status = 'pending_review'
      and old.level is not distinct from new.level
      and old.document_ids is not distinct from new.document_ids then
      return new;
    end if;
  end if;

  select nullif(trim(concat(coalesce(first_name, ''), ' ', coalesce(last_name, ''))), '')
  into requester_name
  from public.profiles
  where id = new.user_id;

  if requester_name is null then
    requester_name := 'Un membre';
  end if;

  level_label := coalesce(nullif(trim(new.level), ''), 'identity');
  notif_id := 'NOT-VER-' || new.id;

  for admin_record in
    select id
    from public.profiles
    where role in ('admin', 'superadmin')
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
      notif_id || '-' || left(replace(admin_record.id::text, '-', ''), 12),
      admin_record.id,
      'Nouvelle verification de compte',
      requester_name || ' a soumis un dossier (' || level_label || ').',
      'moderation',
      '/admin?view=verifications',
      'high',
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

drop trigger if exists verification_request_notify_admins on public.verification_requests;
create trigger verification_request_notify_admins
  after insert or update of status, level, document_ids on public.verification_requests
  for each row
  execute function public.moxt_notify_admins_verification_request();

-- Deep-link suppressions de compte vers les files d'action admin
create or replace function public.moxt_notify_admins_account_deletion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_record record;
  requester_name text;
begin
  if new.status is distinct from 'requested' then
    return new;
  end if;

  select nullif(trim(concat(coalesce(first_name, ''), ' ', coalesce(last_name, ''))), '')
  into requester_name
  from public.profiles
  where id = new.user_id;

  if requester_name is null then
    requester_name := 'Un membre';
  end if;

  for admin_record in
    select id
    from public.profiles
    where role in ('admin', 'superadmin')
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
      'NOT-DEL-' || new.id,
      admin_record.id,
      'Demande de suppression de compte',
      requester_name || ' a demandé la suppression de son compte.',
      'moderation',
      '/admin?view=queues',
      'high',
      false,
      false,
      now(),
      coalesce(new.created_at, now())
    )
    on conflict (id) do nothing;
  end loop;

  return new;
end;
$$;

notify pgrst, 'reload schema';
