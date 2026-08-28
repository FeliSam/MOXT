-- Aligner la suppression des commentaires d’annonce sur les posts (casts, idempotence, payload)

create or replace function public.moxt_listing_toggle_like(p_listing_id text)
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
  from public.listings
  where id = p_listing_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Annonce introuvable';
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

  update public.listings
  set
    likes = v_new_likes,
    payload = jsonb_set(coalesce(payload, '{}'::jsonb), '{likes}', v_new_likes, true),
    updated_at = now()
  where id = p_listing_id;

  return v_new_likes;
end;
$$;

create or replace function public.moxt_listing_add_comment(p_listing_id text, p_comment jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comments jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  if p_comment is null or coalesce(p_comment->>'text', '') = '' then
    raise exception 'Commentaire vide';
  end if;

  update public.listings
  set
    comments = public.moxt_jsonb_as_array(comments) || jsonb_build_array(p_comment),
    payload = jsonb_set(
      coalesce(payload, '{}'::jsonb),
      '{comments}',
      public.moxt_jsonb_as_array(comments) || jsonb_build_array(p_comment),
      true
    ),
    updated_at = now()
  where id = p_listing_id
    and status = 'active'
  returning comments into v_comments;

  if not found then
    raise exception 'Annonce introuvable';
  end if;
end;
$$;

create or replace function public.moxt_listing_delete_comment(p_listing_id text, p_comment_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.listings%rowtype;
  v_comments jsonb;
  v_comment jsonb;
  v_comment_author text;
  v_new_comments jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  if p_comment_id is null or length(trim(p_comment_id)) = 0 then
    raise exception 'Commentaire introuvable';
  end if;

  select *
  into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'Annonce introuvable';
  end if;

  v_comments := public.moxt_jsonb_as_array(v_listing.comments);

  select elem
  into v_comment
  from jsonb_array_elements(v_comments) elem
  where elem->>'id' = p_comment_id
  limit 1;

  if v_comment is null then
    return;
  end if;

  v_comment_author := coalesce(v_comment->>'authorId', v_comment->>'author_id', '');

  if v_comment_author <> (select auth.uid())::text
     and v_listing.owner_id::text <> (select auth.uid())::text
     and not public.moxt_is_moderator() then
    raise exception 'Permission refusée';
  end if;

  select coalesce(jsonb_agg(elem), '[]'::jsonb)
  into v_new_comments
  from jsonb_array_elements(v_comments) elem
  where elem->>'id' is distinct from p_comment_id;

  update public.listings
  set
    comments = v_new_comments,
    payload = jsonb_set(coalesce(payload, '{}'::jsonb), '{comments}', v_new_comments, true),
    updated_at = now()
  where id = p_listing_id;
end;
$$;

notify pgrst, 'reload schema';
