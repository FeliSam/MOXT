-- Module Avatar (admin) : interrupteur dans app_module_flags + réglages dédiés app_avatar_settings.
-- Même mécanique que app_feed_playback : ligne singleton, lecture publique, écriture admin via RPC.
-- Défauts = comportement livré avec l'éditeur (PR #48) : rien ne change tant que l'admin ne touche à rien.

-- 1) Flag « avatar » dans la liste des modules activables (défaut true).

update public.app_module_flags
set config = coalesce(config, '{}'::jsonb)
  || jsonb_build_object('avatar', coalesce((config ->> 'avatar')::boolean, true)),
  updated_at = now()
where id = 1
  and not (coalesce(config, '{}'::jsonb) ? 'avatar');

alter table public.app_module_flags
  alter column config set default '{"stars": false, "feed": true, "news": true, "videos": false, "events": true, "jobs": true, "parcels": true, "avatar": true}'::jsonb;

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
    'parcels', coalesce((p_config ->> 'parcels')::boolean, true),
    'avatar', coalesce((p_config ->> 'avatar')::boolean, true)
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

-- 2) Réglages du module Avatar (styles, invitation à la connexion, badge).

create table if not exists public.app_avatar_settings (
  id int primary key default 1 check (id = 1),
  config jsonb not null default '{"portraitEnabled":true,"loreleiEnabled":true,"photoEnabled":true,"defaultStyle":"portrait","promptEnabled":true,"promptMaxShows":3,"promptIntervalHours":12,"promptDelaySeconds":3.5,"badgeEnabled":true}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.app_avatar_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.app_avatar_settings enable row level security;

drop policy if exists app_avatar_settings_read on public.app_avatar_settings;
create policy app_avatar_settings_read on public.app_avatar_settings
  for select to authenticated, anon
  using (true);

revoke insert, update, delete on public.app_avatar_settings from authenticated, anon;

create or replace function public.admin_update_app_avatar_settings(p_config jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_portrait boolean;
  v_lorelei boolean;
  v_photo boolean;
  v_default text;
  v_next jsonb;
begin
  if not public.moxt_is_admin() then
    raise exception 'Accès admin requis';
  end if;

  v_portrait := coalesce((p_config ->> 'portraitEnabled')::boolean, true);
  v_lorelei := coalesce((p_config ->> 'loreleiEnabled')::boolean, true);
  v_photo := coalesce((p_config ->> 'photoEnabled')::boolean, true);

  -- Au moins un style actif (sinon retour au portrait, comme le client).
  if not (v_portrait or v_lorelei or v_photo) then
    v_portrait := true;
  end if;

  v_default := coalesce(p_config ->> 'defaultStyle', 'portrait');
  if v_default not in ('portrait', 'lorelei') then
    v_default := 'portrait';
  end if;
  if v_default = 'portrait' and not v_portrait and v_lorelei then
    v_default := 'lorelei';
  elsif v_default = 'lorelei' and not v_lorelei and v_portrait then
    v_default := 'portrait';
  end if;

  v_next := jsonb_build_object(
    'portraitEnabled', v_portrait,
    'loreleiEnabled', v_lorelei,
    'photoEnabled', v_photo,
    'defaultStyle', v_default,
    'promptEnabled', coalesce((p_config ->> 'promptEnabled')::boolean, true),
    'promptMaxShows', least(10, greatest(1, round(coalesce((p_config ->> 'promptMaxShows')::numeric, 3))))::int,
    'promptIntervalHours', least(720, greatest(0, round(coalesce((p_config ->> 'promptIntervalHours')::numeric, 12), 1))),
    'promptDelaySeconds', least(30, greatest(0, round(coalesce((p_config ->> 'promptDelaySeconds')::numeric, 3.5), 1))),
    'badgeEnabled', coalesce((p_config ->> 'badgeEnabled')::boolean, true)
  );

  update public.app_avatar_settings
  set config = v_next,
      updated_at = now(),
      updated_by = auth.uid()
  where id = 1;

  if not found then
    insert into public.app_avatar_settings (id, config, updated_by)
    values (1, v_next, auth.uid());
  end if;

  return v_next;
end;
$$;

revoke all on function public.admin_update_app_avatar_settings(jsonb) from public, anon;
grant execute on function public.admin_update_app_avatar_settings(jsonb) to authenticated;

-- 3) Statistique lecture seule : profils par style d'avatar (admin uniquement).

create or replace function public.admin_avatar_style_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.moxt_is_admin() then
    raise exception 'Accès admin requis';
  end if;

  select jsonb_build_object(
    'portrait', count(*) filter (where s.kind = 'portrait'),
    'lorelei', count(*) filter (where s.kind = 'lorelei'),
    'photo', count(*) filter (where s.kind = 'photo'),
    'none', count(*) filter (where s.kind = 'none'),
    'total', count(*)
  )
  into v_result
  from (
    select case
      when coalesce(btrim(p.avatar_url), '') = '' then 'none'
      when p.avatar_url ~* '/avatars/portraits/' then 'portrait'
      when p.avatar_url ~* '/avatars/[^/?#]+/lorelei\.(png|jpe?g)'
        or split_part(coalesce(p.preferences -> 'avatarDicebear' ->> 'avatarUrl', ''), '?', 1)
          = split_part(p.avatar_url, '?', 1) then 'lorelei'
      else 'photo'
    end as kind
    from public.profiles p
  ) s;

  return v_result;
end;
$$;

revoke all on function public.admin_avatar_style_stats() from public, anon;
grant execute on function public.admin_avatar_style_stats() to authenticated;
