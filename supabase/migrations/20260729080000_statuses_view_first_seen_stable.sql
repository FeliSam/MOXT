-- Stabilise les vues de statuts :
-- 1) ne réécrit plus viewedAt à chaque revue (conserve la 1re date)
-- 2) n'ajoute l'utilisateur à viewed_by qu'une seule fois
-- 3) lit viewed_by sans double-encodage to_jsonb

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
  v_viewers jsonb;
  v_existing jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select
    coalesce(viewed_by, '[]'::jsonb),
    coalesce(viewers, '{}'::jsonb)
  into v_viewed_by, v_viewers
  from public.statuses
  where id = p_status_id
    and expires_at > now();

  if not found then
    return;
  end if;

  -- Déjà vu : ne rien réécrire (date de 1re vue figée).
  if exists (
    select 1 from jsonb_array_elements_text(v_viewed_by) v where v = v_uid
  ) then
    return;
  end if;

  v_viewed_by := v_viewed_by || to_jsonb(v_uid);
  v_existing := v_viewers -> v_uid;

  if v_existing is null then
    v_viewers := jsonb_set(
      v_viewers,
      array[v_uid],
      jsonb_build_object(
        'name', coalesce(p_user_name, ''),
        'avatarUrl', p_user_avatar_url,
        'viewedAt', to_jsonb(timezone('utc', now())::text)
      )
    );
  end if;

  update public.statuses
  set viewed_by = v_viewed_by,
      viewers = v_viewers
  where id = p_status_id;
end;
$$;

notify pgrst, 'reload schema';
