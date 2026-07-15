-- =============================================================================
-- MOXT — Vider les tables métier (public) + comptes Auth
-- =============================================================================
-- ⚠ DANGER : ce script s'exécute sur le projet auquel l'éditeur SQL / le CLI
--   est connecté. Si le Dashboard / link pointe vers la PROD — vous videz la PROD.
--
-- Usage (FR) :
--   1. Faire une sauvegarde (Backup / dump) du projet concerné
--   2. Supabase Dashboard → SQL Editor, OU :
--      supabase db query --linked -f scripts/sql/wipe-app-data.sql
--
-- Ce script :
--   - TRUNCATE des tables public métier (CASCADE + RESTART IDENTITY)
--   - DELETE de auth.users (purge Auth : identities / sessions liées via CASCADE)
--   - N'efface PAS supabase_migrations.schema_migrations
--   - N'efface PAS storage.objects (fichiers Storage — à faire à part si besoin)
-- =============================================================================

begin;

-- Liste issue des migrations supabase/migrations (données app).
-- CASCADE : respecte les FK entre tables public.
-- RESTART IDENTITY : remet les séquences / identity (ex. account_identity_history).
truncate table
  public.account_deletion_requests,
  public.account_identity_history,
  public.business_documents,
  public.business_members,
  public.business_requests,
  public.businesses,
  public.conversations,
  public.device_subscriptions,
  public.disputes,
  public.event_registrations,
  public.event_reports,
  public.events,
  public.favorites,
  public.identity_profiles,
  public.job_applications,
  public.job_reports,
  public.jobs,
  public.listing_questions,
  public.listing_reports,
  public.listings,
  public.messages,
  public.notifications,
  public.p2p_offers,
  public.p2p_orders,
  public.parcel_requests,
  public.parcels,
  public.payments,
  public.personal_documents,
  public.posts,
  public.profiles,
  public.publisher_subscriber_bans,
  public.publisher_subscriptions,
  public.push_dispatch_log,
  public.receipts,
  public.recipient_addresses,
  public.referrals,
  public.reviews,
  public.smsc_events,
  public.subscriber_reports,
  public.support_tickets,
  public.transfer_profiles,
  public.transfers,
  public.verification_requests,
  public.wallet_entries
restart identity cascade;

commit;

-- =============================================================================
-- auth.users — PURGE ACTIVÉE (après TRUNCATE public)
-- =============================================================================
-- Après TRUNCATE de public.profiles :
--   - Sans cette étape, les comptes Auth (auth.users) resteraient orphelins
--     (le trigger moxt_profiles_cascade_auth_user ne s'exécute PAS sur TRUNCATE).
--   - Risque évité : login possible sans profil.
--
-- ⚠ DANGER : supprimer auth.users force la réinscription (e-mail / téléphone libre).
--   Préférez le rôle postgres / service_role. Ne pas exposer sans backup.
--   CASCADE côté Auth nettoie identities / sessions / refresh tokens liés.
--
-- Alternative ciblée (1 user) : public.moxt_purge_user_account(uuid);
--
-- Storage (hors tables public) : vider les buckets via Dashboard Storage, ou :
--   -- delete from storage.objects where bucket_id in (...);
-- =============================================================================

begin;
delete from auth.users;
commit;

-- =============================================================================
-- OPTIONNEL / DANGEREUX — reset de l'historique des migrations
-- =============================================================================
-- Ne pas décommenter sauf besoin explicite de faire croire à Supabase que
-- aucune migration n'a été appliquée (casse le suivi db push / migration).
--
-- -- truncate table supabase_migrations.schema_migrations;
-- =============================================================================
