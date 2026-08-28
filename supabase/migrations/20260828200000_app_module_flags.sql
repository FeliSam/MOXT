-- Flags d’accès aux modules en développement (Stars, Fil, Vidéos).
-- Par défaut : désactivés pour les utilisateurs ; les admins y accèdent toujours côté client.

create table if not exists public.app_module_flags (
  id int primary key default 1 check (id = 1),
  config jsonb not null default '{"stars": false, "feed": false, "videos": false}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.app_module_flags (id, config)
values (1, '{"stars": false, "feed": false, "videos": false}'::jsonb)
on conflict (id) do nothing;

alter table public.app_module_flags enable row level security;

drop policy if exists app_module_flags_read on public.app_module_flags;
create policy app_module_flags_read on public.app_module_flags
  for select to authenticated, anon
  using (true);

revoke insert, update, delete on public.app_module_flags from authenticated, anon;

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
    'feed', coalesce((p_config ->> 'feed')::boolean, false),
    'videos', coalesce((p_config ->> 'videos')::boolean, false)
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
