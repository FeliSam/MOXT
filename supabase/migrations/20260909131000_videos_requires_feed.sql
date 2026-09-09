-- Vidéos ne peut pas rester actif si le fil d'actualité est désactivé.

create or replace function public.admin_update_app_module_flags(p_config jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_feed boolean;
  v_next jsonb;
begin
  if not public.moxt_is_admin() then
    raise exception 'Accès admin requis';
  end if;

  v_feed := coalesce((p_config ->> 'feed')::boolean, true);

  v_next := jsonb_build_object(
    'stars', coalesce((p_config ->> 'stars')::boolean, false),
    'feed', v_feed,
    'news', coalesce((p_config ->> 'news')::boolean, true),
    'videos', v_feed and coalesce((p_config ->> 'videos')::boolean, false),
    'events', coalesce((p_config ->> 'events')::boolean, true),
    'jobs', coalesce((p_config ->> 'jobs')::boolean, true),
    'parcels', coalesce((p_config ->> 'parcels')::boolean, true)
  );

  update public.app_module_flags
  set config = v_next,
      updated_at = now(),
      updated_by = auth.uid()
  where id = 1;

  if not found then
    insert into public.app_module_flags (id, config, updated_by)
    values (1, v_next, auth.uid());
  end if;

  return v_next;
end;
$$;

update public.app_module_flags
set config = config || jsonb_build_object(
  'videos', coalesce((config ->> 'feed')::boolean, true)
            and coalesce((config ->> 'videos')::boolean, false)
),
    updated_at = now()
where id = 1
  and coalesce((config ->> 'videos')::boolean, false) = true
  and coalesce((config ->> 'feed')::boolean, true) = false;

revoke all on function public.admin_update_app_module_flags(jsonb) from public, anon;
grant execute on function public.admin_update_app_module_flags(jsonb) to authenticated;
