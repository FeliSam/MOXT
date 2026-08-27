-- Avis : realtime pour que notes/étoiles se mettent à jour sur tous les appareils
-- dès qu'un commentaire est publié, masqué ou supprimé.

alter table public.reviews replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reviews'
  ) then
    alter publication supabase_realtime add table public.reviews;
  end if;
end;
$$;

notify pgrst, 'reload schema';
