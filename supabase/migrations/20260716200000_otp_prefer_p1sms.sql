-- Mark resend so send-sms forces P1SMS on the next Auth SMS hook call.
-- last_provider = 'prefer_p1sms' is a client signal (cleared after a real send).

create or replace function public.moxt_mark_otp_resend(p_phone text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := trim(coalesce(p_phone, ''));
  v_digits text;
  v_count integer;
begin
  v_digits := regexp_replace(v_phone, '\D', '', 'g');
  if v_digits ~ '^8\d{10}$' then
    v_phone := '+7' || substring(v_digits from 2);
  elsif v_phone like '+%' then
    v_phone := '+' || v_digits;
  elsif length(v_digits) = 11 and v_digits like '7%' then
    v_phone := '+' || v_digits;
  elsif length(v_digits) = 10 then
    v_phone := '+7' || v_digits;
  else
    v_phone := case when v_digits = '' then '' else '+' || v_digits end;
  end if;

  if v_phone = '' then
    raise exception 'phone required';
  end if;

  -- Ensure a prior attempt exists and signal P1SMS for the next hook invocation.
  insert into public.otp_sms_route (phone, send_count, last_provider, updated_at)
  values (v_phone, 1, 'prefer_p1sms', now())
  on conflict (phone) do update set
    send_count = greatest(public.otp_sms_route.send_count, 1),
    last_provider = 'prefer_p1sms',
    updated_at = now()
  returning send_count into v_count;

  return v_count;
end;
$$;

revoke all on function public.moxt_mark_otp_resend(text) from public;
grant execute on function public.moxt_mark_otp_resend(text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
