-- Compteurs de vues : jusqu'ici seul `listings` avait une colonne `views`,
-- et rien ne l'écrivait jamais en base (incrément purement Redux, exclu de la
-- persistance). Le compteur repartait donc à zéro à chaque rafraîchissement.
--
-- On ajoute la colonne aux 3 autres types et un RPC atomique qui incrémente
-- côté serveur, en ignorant les vues du propriétaire de la publication.

alter table public.jobs    add column if not exists views integer not null default 0;
alter table public.parcels add column if not exists views integer not null default 0;
alter table public.events  add column if not exists views integer not null default 0;

alter table public.listings alter column views set default 0;
update public.listings set views = 0 where views is null;

create or replace function public.moxt_increment_view(
  p_entity_type text,
  p_entity_id text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viewer text := coalesce((select auth.uid())::text, '');
  v_views integer;
begin
  if v_viewer = '' or coalesce(p_entity_id, '') = '' then
    return null;
  end if;

  -- `owner_id is distinct from v_viewer` : une vue de l'auteur sur sa propre
  -- publication ne doit pas gonfler son compteur.
  case p_entity_type
    when 'listing' then
      update public.listings set views = coalesce(views, 0) + 1
      where id = p_entity_id and owner_id is distinct from v_viewer
      returning views into v_views;
    when 'job' then
      update public.jobs set views = coalesce(views, 0) + 1
      where id = p_entity_id and owner_id is distinct from v_viewer
      returning views into v_views;
    when 'parcel' then
      update public.parcels set views = coalesce(views, 0) + 1
      where id = p_entity_id and owner_id is distinct from v_viewer
      returning views into v_views;
    when 'event' then
      update public.events set views = coalesce(views, 0) + 1
      where id = p_entity_id and owner_id is distinct from v_viewer
      returning views into v_views;
    else
      return null;
  end case;

  return v_views;
end;
$$;

revoke all on function public.moxt_increment_view(text, text) from public;
grant execute on function public.moxt_increment_view(text, text) to authenticated;

notify pgrst, 'reload schema';
