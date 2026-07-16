-- =============================================================================
-- MOXT — Purge des inscriptions SMS inachevées (bloque Connexion / Inscription)
-- =============================================================================
-- Supprime les auth.users sans téléphone ni e-mail confirmés, sans profil,
-- créés il y a plus de 15 minutes. Remet aussi le compteur otp_sms_route.
--
-- Usage:
--   Get-Content scripts/phase2.env | ForEach-Object {
--     if ($_ -match '^(SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD|SEND_SMS_HOOK_SECRET)=(.*)$') {
--       Set-Item -Path "Env:$($matches[1])" -Value $matches[2]
--     }
--   }
--   npx supabase db query --linked -f scripts/sql/cleanup-stale-phone-signups.sql
-- =============================================================================

begin;

with stale as (
  select u.id, u.phone
  from auth.users u
  where u.phone_confirmed_at is null
    and u.email_confirmed_at is null
    and u.created_at < now() - interval '15 minutes'
    and coalesce(u.phone, '') <> ''
    and not exists (
      select 1 from public.profiles p where p.id = u.id
    )
)
delete from public.otp_sms_route r
using stale s
where r.phone = public.moxt_normalize_identity_value('phone', coalesce(s.phone, ''))
   or r.phone = ('+' || regexp_replace(coalesce(s.phone, ''), '\D', '', 'g'))
   or r.phone = regexp_replace(coalesce(s.phone, ''), '\D', '', 'g');

with stale as (
  select u.id
  from auth.users u
  where u.phone_confirmed_at is null
    and u.email_confirmed_at is null
    and u.created_at < now() - interval '15 minutes'
    and coalesce(u.phone, '') <> ''
    and not exists (
      select 1 from public.profiles p where p.id = u.id
    )
)
delete from auth.users u
using stale s
where u.id = s.id;

commit;
