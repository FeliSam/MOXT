-- Abonnements push (Web Push VAPID + jetons natifs Capacitor) et dispatch serveur.

create extension if not exists pg_net with schema extensions;

create table if not exists public.device_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('web', 'android', 'ios')),
  endpoint text not null,
  p256dh text,
  auth_key text,
  subscription_json jsonb,
  user_agent text not null default '',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists device_subscriptions_user_enabled_idx
  on public.device_subscriptions (user_id, enabled);

create table if not exists public.push_dispatch_log (
  notification_id text primary key references public.notifications (id) on delete cascade,
  dispatched_at timestamptz not null default now(),
  success boolean not null default true,
  delivered_count integer not null default 0,
  error text
);

alter table public.device_subscriptions enable row level security;
alter table public.push_dispatch_log enable row level security;

drop policy if exists "MOXT users manage own device subscriptions" on public.device_subscriptions;
create policy "MOXT users manage own device subscriptions"
  on public.device_subscriptions
  for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.device_subscriptions to authenticated;

create or replace function public.moxt_touch_device_subscription_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists device_subscriptions_touch_updated_at on public.device_subscriptions;
create trigger device_subscriptions_touch_updated_at
  before update on public.device_subscriptions
  for each row
  execute function public.moxt_touch_device_subscription_updated_at();

create or replace function public.moxt_dispatch_push_for_notification()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  dispatch_url text;
  dispatch_secret text;
begin
  dispatch_url := nullif(current_setting('moxt.send_push_url', true), '');
  if dispatch_url is null then
    return new;
  end if;

  dispatch_secret := coalesce(nullif(current_setting('moxt.push_dispatch_secret', true), ''), '');

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

drop trigger if exists notifications_dispatch_push on public.notifications;
create trigger notifications_dispatch_push
  after insert on public.notifications
  for each row
  execute function public.moxt_dispatch_push_for_notification();

notify pgrst, 'reload schema';
