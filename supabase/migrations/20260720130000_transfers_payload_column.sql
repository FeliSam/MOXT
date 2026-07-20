-- Rattrapage : public.transfers peut exister sans colonne payload
-- (create table if not exists dans core_catalog_sync ne l'ajoute jamais après coup).
--
-- Symptôme client : "Could not find the 'payload' column of 'transfers' in the schema cache"
-- à la création d'un transfert.

alter table public.transfers
  add column if not exists payload jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
