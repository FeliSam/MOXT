-- Compteur de vues vidéo : même RPC que listings/jobs (évite l'échec RLS sur UPDATE direct).

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
    when 'video' then
      update public.videos
      set view_count = coalesce(view_count, 0) + 1, updated_at = now()
      where id = p_entity_id
        and owner_id is distinct from v_viewer
        and status = 'active'
      returning view_count into v_views;
    else
      return null;
  end case;

  return v_views;
end;
$$;

revoke all on function public.moxt_increment_view(text, text) from public;
grant execute on function public.moxt_increment_view(text, text) to authenticated;

notify pgrst, 'reload schema';
