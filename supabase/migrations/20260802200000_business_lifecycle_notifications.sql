-- Notifications entreprises :
-- 1) INSERT → alerter les admins (demande de validation)
-- 2) Passage à verified/approved/active → notifier tous les utilisateurs actifs

create or replace function public.moxt_notify_business_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_visible text[] := array['verified', 'approved', 'active'];
  v_was_visible boolean;
  v_is_visible boolean;
  v_key text;
  v_title text;
  v_message text;
  v_name text;
  admin_record record;
begin
  v_name := coalesce(nullif(trim(new.name), ''), 'Entreprise');

  if tg_op = 'INSERT' then
    v_key := 'business-pending-' || new.id;
    v_title := 'Entreprise à valider';
    v_message := '« ' || left(v_name, 120) || ' » vient d’être créée et attend une validation.';

    for admin_record in
      select id from public.profiles
      where role in ('admin', 'superadmin')
        and coalesce(status, 'active') not in (
          'suspended', 'banned', 'blocked', 'disabled', 'pending_deletion'
        )
    loop
      insert into public.notifications (
        id, user_id, title, message, type, link, priority,
        read, archived, created_at, updated_at
      ) values (
        'NOT-ADM-' || left(v_key, 20) || '-' || left(replace(admin_record.id::text, '-', ''), 12),
        admin_record.id,
        v_title,
        v_message,
        'moderation',
        '/admin?view=businesses',
        'high',
        false, false, now(), now()
      )
      on conflict (id) do update set
        title = excluded.title,
        message = excluded.message,
        read = false,
        archived = false,
        updated_at = now();
    end loop;

    return new;
  end if;

  -- UPDATE : fan-out public quand l’entreprise devient visible
  v_was_visible := coalesce(old.status, '') = any (v_visible);
  v_is_visible := coalesce(new.status, '') = any (v_visible);

  if v_is_visible and not v_was_visible and new.status is distinct from old.status then
    v_key := 'business-verified-' || new.id;
    v_title := 'Nouvelle entreprise';
    v_message := '« ' || left(v_name, 120) || ' » vient d’être créée et est disponible dans l’annuaire MOXT.';

    perform set_config('moxt.skip_push', '1', true);

    insert into public.notifications (
      id, user_id, title, message, type, link, priority,
      read, archived, created_at, updated_at
    )
    select
      'NOT-ALL-' || left(v_key, 24) || '-' || left(replace(p.id::text, '-', ''), 12),
      p.id,
      v_title,
      v_message,
      'business',
      '/businesses/' || new.id,
      'high',
      false,
      false,
      now(),
      now()
    from public.profiles p
    where coalesce(p.status, 'active') not in (
        'suspended', 'banned', 'blocked', 'disabled', 'pending_deletion'
      )
    on conflict (id) do update set
      title = excluded.title,
      message = excluded.message,
      link = excluded.link,
      type = excluded.type,
      priority = excluded.priority,
      read = false,
      archived = false,
      updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists moxt_business_lifecycle_notify on public.businesses;
create trigger moxt_business_lifecycle_notify
  after insert or update of status on public.businesses
  for each row
  execute function public.moxt_notify_business_lifecycle();

revoke all on function public.moxt_notify_business_lifecycle() from public;

notify pgrst, 'reload schema';
