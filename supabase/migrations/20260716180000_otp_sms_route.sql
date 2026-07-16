-- Track OTP SMS attempts per phone so send-sms can route:
--   attempt 1 → SMSC, attempt 2+ → P1SMS (no dual-send on the same attempt).

create table if not exists public.otp_sms_route (
  phone text primary key,
  send_count integer not null default 0 check (send_count >= 0),
  last_provider text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists otp_sms_route_updated_idx
  on public.otp_sms_route (updated_at desc);

alter table public.otp_sms_route enable row level security;

-- No policies for anon/authenticated: Edge Function uses service role only.
revoke all on table public.otp_sms_route from public, anon, authenticated;
grant all on table public.otp_sms_route to service_role;

create or replace function public.claim_otp_sms_attempt(p_phone text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := trim(coalesce(p_phone, ''));
  v_count integer;
begin
  if v_phone = '' then
    raise exception 'phone required';
  end if;

  insert into public.otp_sms_route (phone, send_count, last_provider, updated_at)
  values (v_phone, 1, '', now())
  on conflict (phone) do update set
    send_count = case
      when public.otp_sms_route.updated_at < now() - interval '3 hours' then 1
      else public.otp_sms_route.send_count + 1
    end,
    updated_at = now()
  returning send_count into v_count;

  return v_count;
end;
$$;

revoke all on function public.claim_otp_sms_attempt(text) from public, anon, authenticated;
grant execute on function public.claim_otp_sms_attempt(text) to service_role;

create or replace function public.mark_otp_sms_provider(p_phone text, p_provider text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.otp_sms_route
  set last_provider = coalesce(p_provider, ''),
      updated_at = now()
  where phone = trim(coalesce(p_phone, ''));
end;
$$;

revoke all on function public.mark_otp_sms_provider(text, text) from public, anon, authenticated;
grant execute on function public.mark_otp_sms_provider(text, text) to service_role;

notify pgrst, 'reload schema';
