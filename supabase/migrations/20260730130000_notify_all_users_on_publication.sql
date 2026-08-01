-- Broadcast catalogue publications to every active user (in-app notifications).
-- Mass push is skipped to avoid flooding Edge / provider quotas.

create table if not exists public.moxt_publication_broadcast_log (
  actor_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists moxt_publication_broadcast_log_actor_idx
  on public.moxt_publication_broadcast_log (actor_id, created_at desc);

alter table public.moxt_publication_broadcast_log enable row level security;

create or replace function public.moxt_dispatch_push_for_notification()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, private
as $$
declare
  dispatch_url text := coalesce(
    nullif(current_setting('moxt.send_push_url', true), ''),
    'https://rbvqfkccbkwjxkvpnwqn.supabase.co/functions/v1/send-push'
  );
  dispatch_secret text := coalesce(
    nullif(current_setting('moxt.push_dispatch_secret', true), ''),
    (select s.value from private.moxt_runtime_settings s where s.key = 'push_dispatch_secret' limit 1),
    ''
  );
begin
  -- Bulk catalogue fan-out sets this to avoid N HTTP posts per publish.
  if coalesce(current_setting('moxt.skip_push', true), '') = '1' then
    return new;
  end if;

  if dispatch_secret = '' then
    return new;
  end if;

  perform net.http_post(
    url := dispatch_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-moxt-push-secret', dispatch_secret
    ),
    body := jsonb_build_object('notificationId', new.id)
  );

  return new;
end;
$$;

create or replace function public.moxt_notify_all_users(
  p_title text,
  p_message text,
  p_type text default 'publication',
  p_link text default '/',
  p_priority text default 'normal',
  p_dedupe_key text default null
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
  v_recent int;
  v_count int := 0;
begin
  if v_actor is null then
    raise exception 'Authentification requise.';
  end if;

  if v_title = '' then
    raise exception 'title required';
  end if;

  if v_link ~* '^https?://[^/]+(/.*)$' then
    v_link := substring(v_link from '^https?://[^/]+(/.*)$');
  end if;
  if left(v_link, 1) <> '/' or left(v_link, 2) = '//' or v_link ~* '^(javascript:|data:)' then
    v_link := '/';
  end if;

  -- Anti-spam : 40 publications broadcast / heure / auteur (hors admin)
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

revoke all on function public.moxt_notify_all_users(text, text, text, text, text, text) from public;
grant execute on function public.moxt_notify_all_users(text, text, text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
