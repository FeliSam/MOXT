-- Bug de sécurité trouvé (Supabase advisor) : la politique RLS "MOXT update
-- statuses" a un WITH CHECK toujours vrai (`true`) — n'importe quel utilisateur
-- authentifié peut donc modifier N'IMPORTE QUEL statut non expiré d'un AUTRE
-- utilisateur (pas seulement ajouter une vue/réaction, mais réécrire le
-- contenu entier). Cette permission large existait pour permettre à un
-- spectateur d'enregistrer sa vue/réaction sur le statut de quelqu'un d'autre.
--
-- Correctif : même schéma que public.posts (moxt_post_add_comment /
-- moxt_post_toggle_like) — les interactions d'un tiers passent désormais par
-- des RPC security definer dédiées, et la politique UPDATE brute est
-- restreinte à l'auteur.

create or replace function public.moxt_status_mark_viewed(
  p_status_id text,
  p_user_name text default '',
  p_user_avatar_url text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := auth.uid()::text;
  v_viewed_by jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select coalesce(to_jsonb(viewed_by), '[]'::jsonb)
  into v_viewed_by
  from public.statuses
  where id = p_status_id
    and expires_at > now();

  if not found then
    return;
  end if;

  if not exists (
    select 1 from jsonb_array_elements_text(v_viewed_by) v where v = v_uid
  ) then
    v_viewed_by := v_viewed_by || to_jsonb(v_uid);
  end if;

  update public.statuses
  set viewed_by = v_viewed_by,
      viewers = jsonb_set(
        coalesce(viewers, '{}'::jsonb),
        array[v_uid],
        jsonb_build_object(
          'name', coalesce(p_user_name, ''),
          'avatarUrl', p_user_avatar_url,
          'viewedAt', to_jsonb(now())
        )
      )
  where id = p_status_id;
end;
$$;

create or replace function public.moxt_status_react(
  p_status_id text,
  p_image_key text,
  p_emoji text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := auth.uid()::text;
  v_reactions jsonb;
  v_image_reactions jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;
  if p_image_key is null or p_image_key = '' then
    raise exception 'imageKey requis';
  end if;

  select coalesce(reactions, '{}'::jsonb)
  into v_reactions
  from public.statuses
  where id = p_status_id
    and expires_at > now();

  if not found then
    return;
  end if;

  v_image_reactions := coalesce(v_reactions -> p_image_key, '{}'::jsonb);

  if p_emoji is null or p_emoji = '' then
    v_image_reactions := v_image_reactions - v_uid;
  else
    v_image_reactions := jsonb_set(v_image_reactions, array[v_uid], to_jsonb(p_emoji));
  end if;

  v_reactions := jsonb_set(v_reactions, array[p_image_key], v_image_reactions);

  update public.statuses
  set reactions = v_reactions
  where id = p_status_id;
end;
$$;

revoke all on function public.moxt_status_mark_viewed(text, text, text) from public;
revoke all on function public.moxt_status_react(text, text, text) from public;
grant execute on function public.moxt_status_mark_viewed(text, text, text) to authenticated;
grant execute on function public.moxt_status_react(text, text, text) to authenticated;

-- Politique UPDATE brute réservée à l'auteur — les vues/réactions d'un tiers
-- passent désormais par les RPC ci-dessus (comme pour posts).
drop policy if exists "MOXT update statuses" on public.statuses;
create policy "MOXT update statuses"
on public.statuses
for update
to authenticated
using (author_id::text = (select auth.uid())::text)
with check (author_id::text = (select auth.uid())::text);

notify pgrst, 'reload schema';
