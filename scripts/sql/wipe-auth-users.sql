-- =============================================================================
-- MOXT — Purge Supabase Auth + historique d'identité (slots e-mail / téléphone)
-- =============================================================================
-- Usage:
--   supabase db query --linked -f scripts/sql/wipe-auth-users.sql
--
-- Quand l'utiliser:
--   - vous avez déjà vidé les tables métier public.*
--   - vous devez libérer e-mail / téléphone bloqués par des comptes Auth orphelins
--   - après plusieurs essais d'inscription, le toast « Compte déjà existant » /
--     « Réinscription impossible » revient même avec auth.users vide
--
-- ⚠ DANGER: supprime tous les comptes Auth du projet lié (identities/sessions)
--   ET remet à zéro account_identity_history (limite lifetime 2 comptes / identité).
-- =============================================================================

begin;
delete from auth.users;
-- Les lignes « released » comptent encore dans moxt_check_identity_available (>= 2).
-- Sans ce delete, un wipe Auth laisse le numéro / e-mail définitivement bloqué.
delete from public.account_identity_history;
commit;
