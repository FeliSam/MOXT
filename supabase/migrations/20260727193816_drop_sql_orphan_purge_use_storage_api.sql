-- Supabase interdit la suppression directe dans storage.objects
-- (garde-fou storage.protect_delete). La purge doit donc passer par l'API
-- Storage, c'est-à-dire côté application : on ne conserve que la fonction de
-- LISTE, consommée par l'écran admin « Maintenance du stockage documents »
-- qui supprime ensuite chaque objet via supabase.storage.remove().
drop function if exists public.moxt_purge_orphan_documents(int);

notify pgrst, 'reload schema';
