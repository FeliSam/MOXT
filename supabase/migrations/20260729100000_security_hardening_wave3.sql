-- Security Wave 3: durable edge rate limits, security events, SMS grant,
-- profiles SELECT hole, OTP resend lockdown.

-- =============================================================================
-- #1 Durable rate log (service_role only)
-- =============================================================================

create table if not exists private.moxt_edge_rate_log (
  id bigserial primary key,
  rate_key text not null,
  created_at timestamptz not null default now()
);

create index if not exists moxt_edge_rate_log_key_created_idx
  on private.moxt_edge_rate_log (rate_key, created_at desc);

comment on table private.moxt_edge_rate_log is
  'Compteurs rate-limit partagés entre isolates Edge Functions.';

create or replace function public.moxt_edge_rate_check(
  p_key text,
  p_max int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := left(trim(coalesce(p_key, '')), 200);
  v_max int := greatest(coalesce(p_max, 1), 1);
  v_window int := greatest(coalesce(p_window_seconds, 60), 1);
  v_count int;
begin
  if v_key = '' then
    return false;
  end if;

  -- Purge opportuniste (fenêtre × 4, max 7 jours).
  delete from private.moxt_edge_rate_log
  where created_at < now() - make_interval(secs => least(v_window * 4, 604800));

  select count(*) into v_count
  from private.moxt_edge_rate_log
  where rate_key = v_key
    and created_at > now() - make_interval(secs => v_window);

  if v_count >= v_max then
    return false;
  end if;

  insert into private.moxt_edge_rate_log (rate_key) values (v_key);
  return true;
end;
$$;

revoke all on function public.moxt_edge_rate_check(text, int, int) from public, anon, authenticated;
grant execute on function public.moxt_edge_rate_check(text, int, int) to service_role;

-- =============================================================================
-- #2 Security events (staff read)
-- =============================================================================

create table if not exists public.moxt_security_events (
  id bigserial primary key,
  kind text not null,
  subject text not null default '',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists moxt_security_events_created_idx
  on public.moxt_security_events (created_at desc);

create index if not exists moxt_security_events_kind_idx
  on public.moxt_security_events (kind, created_at desc);

alter table public.moxt_security_events enable row level security;

drop policy if exists "MOXT staff read security events" on public.moxt_security_events;
create policy "MOXT staff read security events"
  on public.moxt_security_events
  for select
  to authenticated
  using (public.moxt_is_admin() or public.moxt_is_moderator());

create or replace function public.moxt_log_security_event(
  p_kind text,
  p_subject text default '',
  p_meta jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.moxt_security_events (kind, subject, meta)
  values (
    left(trim(coalesce(p_kind, 'unknown')), 80),
    left(trim(coalesce(p_subject, '')), 200),
    coalesce(p_meta, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.moxt_log_security_event(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.moxt_log_security_event(text, text, jsonb) to service_role;

comment on table public.moxt_security_events is
  'Journal d''abus (rate-limit, auth refusée, SMS cap) — sans secrets.';

-- =============================================================================
-- #3 SMS send cap: ensure service_role can execute
-- =============================================================================

grant execute on function public.moxt_sms_send_allowed(text, int, int) to service_role;

-- =============================================================================
-- #4 Profiles: drop using(true) community SELECT hole
-- =============================================================================

drop policy if exists "MOXT read community profile basics" on public.profiles;

-- =============================================================================
-- #5 Lock down OTP resend marker (anon could skew provider routing)
-- =============================================================================

revoke all on function public.moxt_mark_otp_resend(text) from public, anon, authenticated;
grant execute on function public.moxt_mark_otp_resend(text) to service_role;

notify pgrst, 'reload schema';
