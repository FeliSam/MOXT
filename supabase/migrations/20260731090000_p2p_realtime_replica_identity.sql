-- P2P realtime : REPLICA IDENTITY FULL (DELETE/UPDATE avec anciennes valeurs)
-- + publication idempotente (évite l’échec si déjà ajouté).

alter table public.p2p_offers replica identity full;
alter table public.p2p_orders replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'p2p_offers'
  ) then
    alter publication supabase_realtime add table public.p2p_offers;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'p2p_orders'
  ) then
    alter publication supabase_realtime add table public.p2p_orders;
  end if;
end;
$$;

notify pgrst, 'reload schema';
