-- Bug trouvé : p2p_offers / p2p_orders n'étaient jamais ajoutées à la publication
-- supabase_realtime (contrairement à listings/transfers) — aucun événement
-- postgres_changes ne pouvait donc jamais être émis pour ces tables, quel que
-- soit le code client. C'est pour ça que la page P2P / échange nécessitait
-- toujours une réactualisation manuelle après une action.

alter publication supabase_realtime add table public.p2p_offers;
alter publication supabase_realtime add table public.p2p_orders;
