-- Interactions sociales vidéos (likes / commentaires) — miroir posts

alter table public.videos
  add column if not exists likes jsonb not null default '[]'::jsonb,
  add column if not exists comments jsonb not null default '[]'::jsonb,
  add column if not exists share_count integer not null default 0;

update public.videos
set likes = public.moxt_jsonb_as_array(likes)
where jsonb_typeof(coalesce(likes, '[]'::jsonb)) is distinct from 'array';

update public.videos
set comments = public.moxt_jsonb_as_array(comments)
where jsonb_typeof(coalesce(comments, '[]'::jsonb)) is distinct from 'array';

create or replace function public.moxt_video_toggle_like(p_video_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := (select auth.uid())::text;
  v_likes jsonb;
  v_new_likes jsonb;
  v_exists boolean;
begin
  if v_uid is null then
    raise exception 'Authentification requise';
  end if;

  select public.moxt_jsonb_as_array(likes)
  into v_likes
  from public.videos
  where id = p_video_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Vidéo introuvable';
  end if;

  select exists (
    select 1
    from jsonb_array_elements_text(v_likes) like_id
    where like_id = v_uid
  )
  into v_exists;

  if v_exists then
    select coalesce(jsonb_agg(to_jsonb(like_id)), '[]'::jsonb)
    into v_new_likes
    from jsonb_array_elements_text(v_likes) like_id
    where like_id <> v_uid;
  else
    v_new_likes := v_likes || jsonb_build_array(v_uid);
  end if;

  update public.videos
  set likes = v_new_likes, updated_at = now()
  where id = p_video_id;

  return v_new_likes;
end;
$$;

create or replace function public.moxt_video_add_comment(p_video_id text, p_comment jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  if p_comment is null or coalesce(p_comment->>'text', '') = '' then
    raise exception 'Commentaire vide';
  end if;

  update public.videos
  set
    comments = public.moxt_jsonb_as_array(comments) || jsonb_build_array(p_comment),
    updated_at = now()
  where id = p_video_id
    and status = 'active';

  if not found then
    raise exception 'Vidéo introuvable';
  end if;
end;
$$;

create or replace function public.moxt_video_delete_comment(p_video_id text, p_comment_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_video public.videos%rowtype;
  v_comments jsonb;
  v_comment jsonb;
  v_comment_author text;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  if p_comment_id is null or length(trim(p_comment_id)) = 0 then
    raise exception 'Commentaire introuvable';
  end if;

  select *
  into v_video
  from public.videos
  where id = p_video_id
  for update;

  if not found then
    raise exception 'Vidéo introuvable';
  end if;

  v_comments := public.moxt_jsonb_as_array(v_video.comments);

  select elem
  into v_comment
  from jsonb_array_elements(v_comments) elem
  where elem->>'id' = p_comment_id
  limit 1;

  if v_comment is null then
    raise exception 'Commentaire introuvable';
  end if;

  v_comment_author := coalesce(v_comment->>'authorId', v_comment->>'author_id', '');

  if v_comment_author <> (select auth.uid())::text
     and v_video.owner_id <> (select auth.uid())
     and not public.moxt_is_moderator() then
    raise exception 'Permission refusée';
  end if;

  update public.videos
  set
    comments = coalesce(
      (
        select jsonb_agg(elem)
        from jsonb_array_elements(v_comments) elem
        where elem->>'id' is distinct from p_comment_id
      ),
      '[]'::jsonb
    ),
    updated_at = now()
  where id = p_video_id;
end;
$$;

create or replace function public.moxt_video_increment_share(p_video_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.videos
  set
    share_count = coalesce(share_count, 0) + 1,
    updated_at = now()
  where id = p_video_id
    and status = 'active'
  returning share_count into v_count;

  if not found then
    raise exception 'Vidéo introuvable';
  end if;

  return v_count;
end;
$$;

revoke all on function public.moxt_video_toggle_like(text) from public;
revoke all on function public.moxt_video_add_comment(text, jsonb) from public;
revoke all on function public.moxt_video_delete_comment(text, text) from public;
revoke all on function public.moxt_video_increment_share(text) from public;

grant execute on function public.moxt_video_toggle_like(text) to authenticated;
grant execute on function public.moxt_video_add_comment(text, jsonb) to authenticated;
grant execute on function public.moxt_video_delete_comment(text, text) to authenticated;
grant execute on function public.moxt_video_increment_share(text) to authenticated, anon;

notify pgrst, 'reload schema';
