-- Fix: comments/likes parfois stockés en jsonb string (ex. JSON.stringify côté client)
-- → jsonb_array_elements échoue → toast « erreur technique » à la suppression.
-- Durcit les RPC posts + répare les lignes existantes.

create or replace function public.moxt_jsonb_as_array(p_value jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  v jsonb := coalesce(p_value, '[]'::jsonb);
  v_parsed jsonb;
begin
  if jsonb_typeof(v) = 'array' then
    return v;
  end if;

  if jsonb_typeof(v) = 'string' then
    begin
      v_parsed := (v #>> '{}')::jsonb;
      if jsonb_typeof(v_parsed) = 'array' then
        return v_parsed;
      end if;
    exception
      when others then
        return '[]'::jsonb;
    end;
  end if;

  return '[]'::jsonb;
end;
$$;

revoke all on function public.moxt_jsonb_as_array(jsonb) from public;
grant execute on function public.moxt_jsonb_as_array(jsonb) to authenticated, service_role;

-- Réparer les données déjà corrompues
update public.posts
set comments = public.moxt_jsonb_as_array(comments)
where jsonb_typeof(coalesce(comments, '[]'::jsonb)) is distinct from 'array';

update public.posts
set likes = public.moxt_jsonb_as_array(likes)
where jsonb_typeof(coalesce(likes, '[]'::jsonb)) is distinct from 'array';

create or replace function public.moxt_post_add_comment(p_post_id text, p_comment jsonb)
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

  update public.posts
  set
    comments = public.moxt_jsonb_as_array(comments) || jsonb_build_array(p_comment),
    updated_at = now()
  where id = p_post_id
    and status = 'published';

  if not found then
    raise exception 'Publication introuvable ou non publiée';
  end if;
end;
$$;

create or replace function public.moxt_post_delete_comment(p_post_id text, p_comment_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post public.posts%rowtype;
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
  into v_post
  from public.posts
  where id = p_post_id
  for update;

  if not found then
    raise exception 'Publication introuvable';
  end if;

  v_comments := public.moxt_jsonb_as_array(v_post.comments);

  select elem
  into v_comment
  from jsonb_array_elements(v_comments) elem
  where elem->>'id' = p_comment_id
  limit 1;

  if v_comment is null then
    -- Idempotent : déjà absent (ex. double clic / sync locale anticipée)
    if v_post.comments is distinct from v_comments then
      update public.posts
      set comments = v_comments, updated_at = now()
      where id = p_post_id;
    end if;
    return;
  end if;

  v_comment_author := coalesce(v_comment->>'authorId', v_comment->>'author_id');

  if coalesce(v_comment_author, '') <> auth.uid()::text
    and v_post.author_id::text <> auth.uid()::text
    and not public.moxt_is_moderator() then
    raise exception 'Suppression non autorisée';
  end if;

  update public.posts
  set
    comments = coalesce(
      (
        select jsonb_agg(elem)
        from jsonb_array_elements(v_comments) elem
        where elem->>'id' <> p_comment_id
      ),
      '[]'::jsonb
    ),
    updated_at = now()
  where id = p_post_id;
end;
$$;

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

  select public.moxt_jsonb_as_array(likes)
  into v_likes
  from public.posts
  where id = p_post_id
    and status = 'published';

  if not found then
    raise exception 'Publication introuvable ou non publiée';
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

-- Remplace la liste complète après vérif (fallback client si comment sans id)
create or replace function public.moxt_post_set_comments(p_post_id text, p_comments jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post public.posts%rowtype;
  v_before jsonb;
  v_after jsonb;
  v_uid text := auth.uid()::text;
  v_removed jsonb;
  v_elem jsonb;
  v_author text;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select *
  into v_post
  from public.posts
  where id = p_post_id
  for update;

  if not found then
    raise exception 'Publication introuvable';
  end if;

  v_before := public.moxt_jsonb_as_array(v_post.comments);
  v_after := public.moxt_jsonb_as_array(p_comments);

  if v_post.author_id::text = v_uid or public.moxt_is_moderator() then
    update public.posts
    set comments = v_after, updated_at = now()
    where id = p_post_id;
    return;
  end if;

  -- Non-auteur : seulement retirer SES propres commentaires (pas d’ajout / édition)
  if jsonb_array_length(v_after) > jsonb_array_length(v_before) then
    raise exception 'Suppression non autorisée';
  end if;

  select coalesce(jsonb_agg(elem), '[]'::jsonb)
  into v_removed
  from jsonb_array_elements(v_before) elem
  where not exists (
    select 1
    from jsonb_array_elements(v_after) kept
    where coalesce(kept->>'id', '') <> ''
      and kept->>'id' = elem->>'id'
  )
  and not (
    coalesce(elem->>'id', '') = ''
    and exists (
      select 1
      from jsonb_array_elements(v_after) kept
      where kept->>'text' is not distinct from elem->>'text'
        and coalesce(kept->>'authorId', kept->>'author_id')
          is not distinct from coalesce(elem->>'authorId', elem->>'author_id')
        and kept->>'createdAt' is not distinct from elem->>'createdAt'
    )
  );

  for v_elem in select * from jsonb_array_elements(v_removed)
  loop
    v_author := coalesce(v_elem->>'authorId', v_elem->>'author_id');
    if coalesce(v_author, '') <> v_uid then
      raise exception 'Suppression non autorisée';
    end if;
  end loop;

  update public.posts
  set comments = v_after, updated_at = now()
  where id = p_post_id;
end;
$$;

revoke all on function public.moxt_post_add_comment(text, jsonb) from public;
revoke all on function public.moxt_post_delete_comment(text, text) from public;
revoke all on function public.moxt_post_toggle_like(text) from public;
revoke all on function public.moxt_post_set_comments(text, jsonb) from public;

grant execute on function public.moxt_post_add_comment(text, jsonb) to authenticated;
grant execute on function public.moxt_post_delete_comment(text, text) to authenticated;
grant execute on function public.moxt_post_toggle_like(text) to authenticated;
grant execute on function public.moxt_post_set_comments(text, jsonb) to authenticated;

notify pgrst, 'reload schema';
