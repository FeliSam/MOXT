-- Plafond d'envoi SMS côté SERVEUR.
--
-- Le plafond existant (otpCooldown.js) vit dans localStorage : vider le cache,
-- changer de navigateur ou scripter la requête le contourne entièrement.
-- Chaque SMS étant facturé, un abus se lit directement sur la facture.
-- Ce compteur est tenu en base et interrogé par la edge function send-sms.

create table if not exists public.sms_send_log (
  id bigserial primary key,
  phone text not null,
  sent_at timestamptz not null default now()
);

create index if not exists sms_send_log_phone_sent_at_idx
  on public.sms_send_log (phone, sent_at desc);

alter table public.sms_send_log enable row level security;
-- Aucune policy : table réservée au service role (edge function).

comment on table public.sms_send_log is
  'Journal des SMS OTP envoyés, pour plafonner le coût côté serveur.';

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

  if v_count >= p_max then
    return false;
  end if;

  insert into public.sms_send_log (phone) values (v_phone);
  return true;
end;
$$;

revoke all on function public.moxt_sms_send_allowed(text, int, int) from public;

notify pgrst, 'reload schema';
