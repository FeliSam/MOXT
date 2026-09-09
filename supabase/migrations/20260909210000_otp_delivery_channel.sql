-- Canal OTP (SMS / Telegram / FlashCall) + code flashcall pour vérifier les 4 derniers chiffres.

create table if not exists public.otp_delivery (
  phone text primary key,
  channel text not null default 'sms'
    check (channel in ('sms', 'telegram', 'flashcall')),
  otp text,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  updated_at timestamptz not null default now()
);

alter table public.otp_delivery enable row level security;

revoke all on table public.otp_delivery from anon, authenticated;
grant all on table public.otp_delivery to service_role;
