-- Push dispatch secret cannot use ALTER DATABASE ... SET on managed Supabase
-- (permission denied). Store it in private settings readable only by
-- security definer functions (e.g. moxt_dispatch_push_for_notification).

create table if not exists private.moxt_runtime_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

revoke all on table private.moxt_runtime_settings from public, anon, authenticated;
grant select, insert, update on table private.moxt_runtime_settings to postgres, service_role;

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
  -- Without a secret, send-push rejects with 401 (client bypass removed).
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
exception
  when others then
    return new;
end;
$$;

notify pgrst, 'reload schema';
