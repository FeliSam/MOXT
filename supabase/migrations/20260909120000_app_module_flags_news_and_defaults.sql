-- Aligne app_module_flags sur les 7 modules du client (news manquait dans le RPC).
-- Défauts identiques à DEFAULT_DEV_MODULE_FLAGS (JS).

update public.app_module_flags
set config = coalesce(config, '{}'::jsonb)
  || jsonb_build_object(
    'stars', coalesce((config ->> 'stars')::boolean, false),
    'feed', coalesce((config ->> 'feed')::boolean, true),
    'news', coalesce((config ->> 'news')::boolean, true),
    'videos', coalesce((config ->> 'videos')::boolean, false),
    'events', coalesce((config ->> 'events')::boolean, true),
    'jobs', coalesce((config ->> 'jobs')::boolean, true),
    'parcels', coalesce((config ->> 'parcels')::boolean, true)
  ),
  updated_at = now()
where id = 1;

alter table public.app_module_flags
  alter column config set default '{"stars": false, "feed": true, "news": true, "videos": false, "events": true, "jobs": true, "parcels": true}'::jsonb;

create or replace function public.admin_update_app_module_flags(p_config jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next jsonb;
begin
  if not public.moxt_is_admin() then
    raise exception 'Accès admin requis';
  end if;

  v_next := jsonb_build_object(
    'stars', coalesce((p_config ->> 'stars')::boolean, false),
    'feed', coalesce((p_config ->> 'feed')::boolean, true),
    'news', coalesce((p_config ->> 'news')::boolean, true),
    'videos', coalesce((p_config ->> 'videos')::boolean, false),
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

revoke all on function public.admin_update_app_module_flags(jsonb) from public, anon;
grant execute on function public.admin_update_app_module_flags(jsonb) to authenticated;
