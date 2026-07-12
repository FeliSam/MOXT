-- Notifier les admins lors d'une demande de suppression de compte (côté serveur, hors RLS client).

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
      '/admin',
      'high',
      false,
      false,
      now(),
      coalesce(new.created_at, now())
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists account_deletion_notify_admins on public.account_deletion_requests;
create trigger account_deletion_notify_admins
  after insert on public.account_deletion_requests
  for each row
  execute function public.moxt_notify_admins_account_deletion();

-- Realtime : livrer les notifications aux admins connectés
alter table public.notifications replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

notify pgrst, 'reload schema';
