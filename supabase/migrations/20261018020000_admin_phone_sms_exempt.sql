-- Migration: Admin & Staff phone number exemption for SMS OTP caps and verification
-- Permet aux administrateurs, superadmins et modérateurs de recevoir des codes OTP
-- SMS sans jamais être bloqués par le plafond journalier ou les restrictions de quotas.

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
  v_is_admin boolean := false;
begin
  if v_phone = '' then
    return false;
  end if;

  -- Admin / Superadmin / Moderator bypass : un numéro admin ne doit JAMAIS être bloqué pour les SMS OTP
  select exists (
    select 1
    from public.profiles p
    where (
      regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g') = v_phone
      or regexp_replace(coalesce(p.origin_phone, ''), '[^0-9]', '', 'g') = v_phone
      or (length(v_phone) >= 10 and right(regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g'), 10) = right(v_phone, 10))
      or (length(v_phone) >= 10 and right(regexp_replace(coalesce(p.origin_phone, ''), '[^0-9]', '', 'g'), 10) = right(v_phone, 10))
    )
    and p.role in ('admin', 'superadmin', 'moderator')
  ) into v_is_admin;

  if v_is_admin then
    return true;
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
  'True if this phone may still receive an OTP SMS (successful-send count under the window). Admins and moderators are always exempt.';

create or replace function public.moxt_is_admin_phone(p_phone text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
  if v_phone = '' then
    return false;
  end if;

  return exists (
    select 1
    from public.profiles p
    where (
      regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g') = v_phone
      or regexp_replace(coalesce(p.origin_phone, ''), '[^0-9]', '', 'g') = v_phone
      or (length(v_phone) >= 10 and right(regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g'), 10) = right(v_phone, 10))
      or (length(v_phone) >= 10 and right(regexp_replace(coalesce(p.origin_phone, ''), '[^0-9]', '', 'g'), 10) = right(v_phone, 10))
    )
    and p.role in ('admin', 'superadmin', 'moderator')
  );
end;
$$;

comment on function public.moxt_is_admin_phone(text) is
  'Returns true if the phone number belongs to an active staff member (admin, superadmin, moderator).';

revoke all on function public.moxt_sms_send_allowed(text, int, int) from public;
grant execute on function public.moxt_sms_send_allowed(text, int, int) to service_role;

revoke all on function public.moxt_is_admin_phone(text) from public;
grant execute on function public.moxt_is_admin_phone(text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
