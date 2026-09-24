-- Réglages globaux lecture Fil (son / pause au tap). Lecture publique ; écriture admin via RPC.

create table if not exists public.app_feed_playback (
  id int primary key default 1 check (id = 1),
  config jsonb not null default '{"soundOnByDefault":true,"tapPausesVideo":true}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.app_feed_playback (id, config)
values (1, '{"soundOnByDefault":true,"tapPausesVideo":true}'::jsonb)
on conflict (id) do nothing;

alter table public.app_feed_playback enable row level security;

drop policy if exists app_feed_playback_read on public.app_feed_playback;
create policy app_feed_playback_read on public.app_feed_playback
  for select to authenticated, anon
  using (true);

revoke insert, update, delete on public.app_feed_playback from authenticated, anon;

create or replace function public.admin_update_app_feed_playback(p_config jsonb)
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
    'soundOnByDefault', coalesce((p_config ->> 'soundOnByDefault')::boolean, true),
    'tapPausesVideo', coalesce((p_config ->> 'tapPausesVideo')::boolean, true)
  );

  update public.app_feed_playback
  set config = v_next,
      updated_at = now(),
      updated_by = auth.uid()
  where id = 1;

  if not found then
    insert into public.app_feed_playback (id, config, updated_by)
    values (1, v_next, auth.uid());
  end if;

  return v_next;
end;
$$;

revoke all on function public.admin_update_app_feed_playback(jsonb) from public, anon;
grant execute on function public.admin_update_app_feed_playback(jsonb) to authenticated;
