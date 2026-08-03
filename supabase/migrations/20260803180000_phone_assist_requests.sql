-- Demandes d'aide validation téléphone (OTP SMS non reçu)

create table if not exists public.phone_assist_requests (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  phone text not null default '',
  note text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id),
  review_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists phone_assist_requests_user_idx
  on public.phone_assist_requests (user_id, created_at desc);

create index if not exists phone_assist_requests_status_idx
  on public.phone_assist_requests (status, created_at desc);

-- Un seul dossier pending par utilisateur
create unique index if not exists phone_assist_requests_one_pending_per_user
  on public.phone_assist_requests (user_id)
  where status = 'pending';

alter table public.phone_assist_requests enable row level security;

drop policy if exists "MOXT users insert own phone assist" on public.phone_assist_requests;
create policy "MOXT users insert own phone assist"
  on public.phone_assist_requests for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "MOXT users read own phone assist" on public.phone_assist_requests;
create policy "MOXT users read own phone assist"
  on public.phone_assist_requests for select to authenticated
  using (user_id = auth.uid() or public.moxt_is_admin() or public.moxt_is_moderator());

drop policy if exists "MOXT admins update phone assist" on public.phone_assist_requests;
create policy "MOXT admins update phone assist"
  on public.phone_assist_requests for update to authenticated
  using (public.moxt_is_admin() or public.moxt_is_moderator())
  with check (public.moxt_is_admin() or public.moxt_is_moderator());

grant select, insert, update on public.phone_assist_requests to authenticated;

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
begin
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

revoke all on function public.moxt_notify_admins_phone_assist() from public, anon;
grant execute on function public.moxt_notify_admins_phone_assist() to authenticated;

drop trigger if exists phone_assist_notify_admins on public.phone_assist_requests;
create trigger phone_assist_notify_admins
  after insert or update of status on public.phone_assist_requests
  for each row
  execute function public.moxt_notify_admins_phone_assist();
