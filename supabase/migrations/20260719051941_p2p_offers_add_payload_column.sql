-- p2p_offers a été créée avant que 20260708060000_extended_sync.sql n'y ajoute
-- la colonne payload — le `create table if not exists` de cette migration était
-- alors un no-op, et payload n'a jamais été créée en base malgré la migration
-- marquée comme appliquée. Le client écrit toujours payload=offer (jsonb),
-- ce qui cassait le sync ("Synchronisation impossible : could not find the
-- payload column of p2p_offers in the schema cache").

alter table public.p2p_offers add column if not exists payload jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
