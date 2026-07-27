-- L'action admin "Vérifier l'e-mail" confirmait auth.users.email_confirmed_at
-- (via la edge function admin-verify-email, service role) mais n'écrivait
-- jamais dans public.profiles — que le client peut lire. Résultat : le bouton
-- ne reflétait jamais l'état après l'action (le panneau admin lit profiles,
-- pas auth.users). On ajoute les colonnes miroir, même convention que
-- phone_verified / phone_verified_at (cf. 20260712140000_profile_phone_verified.sql).

alter table public.profiles
  add column if not exists email_verified boolean not null default false,
  add column if not exists email_verified_at timestamptz;
