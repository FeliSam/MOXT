-- Publie les transferts en Realtime pour que l'entreprise voie
-- immédiatement un transfert dès sa création (et les mises à jour de statut).

alter table public.transfers replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'transfers'
  ) then
    alter publication supabase_realtime add table public.transfers;
  end if;
end;
$$;

notify pgrst, 'reload schema';
