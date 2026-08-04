-- Validation manuelle téléphone : aligner Auth + profil, backfill, notifier le demandeur.

drop function if exists public.moxt_admin_verify_phone(uuid);
drop function if exists public.moxt_admin_verify_phone(uuid, text);

create or replace function public.moxt_admin_verify_phone(
  p_user_id uuid,
  p_phone text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_phone text;
begin
  if not public.moxt_is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  v_phone := nullif(trim(coalesce(p_phone, '')), '');

  if v_phone is null then
    select nullif(trim(phone), '') into v_phone from public.profiles where id = p_user_id;
  end if;
  if v_phone is null then
    select nullif(trim(phone), '') into v_phone from auth.users where id = p_user_id;
  end if;

  update public.profiles
  set
    phone = coalesce(v_phone, phone),
    phone_verified = true,
    phone_verified_at = coalesce(phone_verified_at, now()),
    updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'Utilisateur introuvable.';
  end if;

  -- Auth : nécessaire pour signInWithPassword({ phone }) et OTP.
  update auth.users
  set
    phone = coalesce(v_phone, nullif(trim(phone), ''), phone),
    phone_confirmed_at = coalesce(phone_confirmed_at, now()),
    updated_at = now()
  where id = p_user_id;
end;
$$;

revoke all on function public.moxt_admin_verify_phone(uuid, text) from public;
grant execute on function public.moxt_admin_verify_phone(uuid, text) to authenticated;

-- ── Backfill : numéros déjà validés manuellement (profil) → Auth ────────────

update auth.users u
set
  phone = case
    when coalesce(nullif(trim(u.phone), ''), '') = ''
      and coalesce(nullif(trim(p.phone), ''), '') <> ''
    then trim(p.phone)
    else u.phone
  end,
  phone_confirmed_at = coalesce(u.phone_confirmed_at, p.phone_verified_at, now()),
  updated_at = now()
from public.profiles p
where p.id = u.id
  and p.phone_verified is true
  and u.phone_confirmed_at is null;

-- ── Notifier admins (demande) + demandeur (décision) ───────────────────────

create or replace function public.moxt_notify_admins_phone_assist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_record record;
  requester_name text;
  notif_id text;
  decision_title text;
  decision_message text;
begin
  -- Décision admin → notifier le demandeur
  if tg_op = 'UPDATE'
     and old.status = 'pending'
     and new.status in ('approved', 'rejected') then
    if new.status = 'approved' then
      decision_title := 'Numéro validé';
      decision_message :=
        'Votre numéro '
        || coalesce(nullif(trim(new.phone), ''), '')
        || ' a été confirmé par l''équipe MOXT. Vous pouvez vous connecter avec ce numéro.';
    else
      decision_title := 'Demande de validation refusée';
      decision_message := coalesce(
        nullif(trim(new.review_note), ''),
        'Votre demande de validation manuelle du numéro a été refusée. Réessayez le SMS ou contactez le support.'
      );
    end if;

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
      'NOT-PHA-USER-' || new.id,
      new.user_id,
      decision_title,
      left(decision_message, 500),
      'security',
      '/security',
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

    return new;
  end if;

  -- Nouvelle demande pending → notifier les admins
  if new.status is distinct from 'pending' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'pending' then
    return new;
  end if;

  select nullif(trim(concat(coalesce(first_name, ''), ' ', coalesce(last_name, ''))), '')
  into requester_name
  from public.profiles
  where id = new.user_id;

  if requester_name is null then
    requester_name := 'Un membre';
  end if;

  notif_id := 'NOT-PHA-' || new.id;

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
      'Demande validation telephone',
      requester_name || ' ne recoit pas le SMS OTP (' || coalesce(nullif(trim(new.phone), ''), 'numero') || ').',
      'moderation',
      '/admin?view=queues',
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

drop trigger if exists phone_assist_notify_admins on public.phone_assist_requests;
create trigger phone_assist_notify_admins
  after insert or update of status on public.phone_assist_requests
  for each row
  execute function public.moxt_notify_admins_phone_assist();

notify pgrst, 'reload schema';
