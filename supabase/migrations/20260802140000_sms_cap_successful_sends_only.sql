-- SMS cost cap: count SUCCESSFUL sends only.
-- Previous moxt_sms_send_allowed inserted a row before the provider call, so
-- failed SMSC/hook attempts burned the daily quota and left devices stuck with
-- "SMS temporairement indisponible" even hours later.

create or replace function public.moxt_sms_send_allowed(
  p_phone text,
  p_max int default 10,
  p_window_hours int default 24
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
  if v_phone = '' then
    return false;
  end if;

  -- Purge opportuniste : garde la table petite sans cron dédié.
  delete from public.sms_send_log where sent_at < now() - interval '7 days';

  select count(*) into v_count
  from public.sms_send_log
  where phone = v_phone
    and sent_at > now() - make_interval(hours => p_window_hours);

  return v_count < p_max;
end;
$$;

comment on function public.moxt_sms_send_allowed(text, int, int) is
  'True if this phone may still receive an OTP SMS (successful-send count under the window). Does not insert.';

create or replace function public.moxt_sms_send_record(p_phone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
  if v_phone = '' then
    return;
  end if;
  insert into public.sms_send_log (phone) values (v_phone);
end;
$$;

comment on function public.moxt_sms_send_record(text) is
  'Record a successful OTP SMS send for the server-side daily cost cap.';

revoke all on function public.moxt_sms_send_allowed(text, int, int) from public;
revoke all on function public.moxt_sms_send_record(text) from public;
grant execute on function public.moxt_sms_send_allowed(text, int, int) to service_role;
grant execute on function public.moxt_sms_send_record(text) to service_role;

notify pgrst, 'reload schema';
