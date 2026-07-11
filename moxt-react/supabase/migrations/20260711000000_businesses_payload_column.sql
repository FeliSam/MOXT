-- Rattrapage de schéma : la table public.businesses préexistante n'avait pas la
-- colonne payload. La migration 20260708020000_sync_businesses.sql la déclare mais
-- via `create table if not exists`, qui est ignoré quand la table existe déjà —
-- la colonne n'est donc jamais ajoutée aux tables créées auparavant.
--
-- Symptôme : "Could not find the 'payload' column of 'businesses' in the schema cache"
-- lors de la création / modification d'une entreprise.

alter table public.businesses
  add column if not exists payload jsonb not null default '{}'::jsonb;

-- Recharge immédiate du cache de schéma PostgREST (Supabase).
notify pgrst, 'reload schema';
