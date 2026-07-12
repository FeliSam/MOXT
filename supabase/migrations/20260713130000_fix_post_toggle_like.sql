-- Corrige « cannot extract elements from a scalar » quand likes n'est pas un tableau JSON.
update public.posts
set likes = '[]'::jsonb
where likes is null or jsonb_typeof(likes) <> 'array';

create or replace function public.moxt_post_toggle_like(p_post_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := auth.uid()::text;
  v_likes jsonb;
  v_new_likes jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select likes
  into v_likes
  from public.posts
  where id = p_post_id
    and status = 'published';

  if not found then
    raise exception 'Publication introuvable ou non publiée';
  end if;

  v_likes := coalesce(v_likes, '[]'::jsonb);
  if jsonb_typeof(v_likes) <> 'array' then
    v_likes := '[]'::jsonb;
  end if;

  if exists (
    select 1
    from jsonb_array_elements_text(v_likes) like_id
    where like_id = v_uid
  ) then
    select coalesce(jsonb_agg(to_jsonb(like_id)), '[]'::jsonb)
    into v_new_likes
    from jsonb_array_elements_text(v_likes) like_id
    where like_id <> v_uid;
  else
    v_new_likes := v_likes || jsonb_build_array(v_uid);
  end if;

  update public.posts
  set likes = v_new_likes, updated_at = now()
  where id = p_post_id;

  return v_new_likes;
end;
$$;

notify pgrst, 'reload schema';
