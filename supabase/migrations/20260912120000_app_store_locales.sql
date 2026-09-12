-- Langue par défaut de l’app selon le store (iOS, Google Play, RuStore, web).
-- Lecture publique ; écriture réservée aux admins via RPC.

create table if not exists public.app_store_locales (
  id int primary key default 1 check (id = 1),
  config jsonb not null default '{"ios":"fr","play":"fr","rustore":"ru","web":"fr"}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.app_store_locales (id, config)
values (1, '{"ios":"fr","play":"fr","rustore":"ru","web":"fr"}'::jsonb)
on conflict (id) do nothing;

alter table public.app_store_locales enable row level security;

drop policy if exists app_store_locales_read on public.app_store_locales;
create policy app_store_locales_read on public.app_store_locales
  for select to authenticated, anon
  using (true);

revoke insert, update, delete on public.app_store_locales from authenticated, anon;

create or replace function public.admin_update_app_store_locales(p_config jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowed text[] := array['fr', 'en', 'ru', 'pt', 'es'];
  v_pick text;
  v_next jsonb;
begin
  if not public.moxt_is_admin() then
    raise exception 'Accès admin requis';
  end if;

  v_next := '{}'::jsonb;
  foreach v_pick in array array['ios', 'play', 'rustore', 'web']
  loop
    v_next := v_next || jsonb_build_object(
      v_pick,
      case
        when (p_config ->> v_pick) = any (v_allowed) then p_config ->> v_pick
        when v_pick = 'rustore' then 'ru'
        else 'fr'
      end
    );
  end loop;

  update public.app_store_locales
  set config = v_next,
      updated_at = now(),
      updated_by = auth.uid()
  where id = 1;

  if not found then
    insert into public.app_store_locales (id, config, updated_by)
    values (1, v_next, auth.uid());
  end if;

  return v_next;
end;
$$;

revoke all on function public.admin_update_app_store_locales(jsonb) from public, anon;
grant execute on function public.admin_update_app_store_locales(jsonb) to authenticated;
