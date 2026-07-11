-- Colonnes de réception client (idempotent — corrige le cache schéma Supabase)
alter table public.transfers add column if not exists received_method text;
alter table public.transfers add column if not exists received_proof jsonb;
alter table public.transfers add column if not exists received_at timestamptz;
