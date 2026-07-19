-- Le client envoyait JSON.stringify(...) pour viewed_by/viewers/reactions avant
-- l'insert/update, ce qui stockait une STRING jsonb (le texte JSON échappé) au
-- lieu d'un vrai tableau/objet jsonb. Corrige les lignes existantes en dé-échappant
-- une fois ces valeurs, puis en les recastant en jsonb natif.

update public.statuses
set viewed_by = (viewed_by #>> '{}')::jsonb
where jsonb_typeof(viewed_by) = 'string';

update public.statuses
set viewers = (viewers #>> '{}')::jsonb
where jsonb_typeof(viewers) = 'string';

update public.statuses
set reactions = (reactions #>> '{}')::jsonb
where jsonb_typeof(reactions) = 'string';

notify pgrst, 'reload schema';
