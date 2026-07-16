-- =============================================================================
-- MOXT — Purge uniquement Supabase Auth (auth.users)
-- =============================================================================
-- Usage:
--   supabase db query --linked -f scripts/sql/wipe-auth-users.sql
--
-- Quand l'utiliser:
--   - vous avez déjà vidé les tables métier public.*
--   - vous devez libérer e-mail / téléphone bloqués par des comptes Auth orphelins
--
-- ⚠ DANGER: supprime tous les comptes Auth du projet lié (identities/sessions incluses).
-- =============================================================================

begin;
delete from auth.users;
commit;
