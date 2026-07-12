-- Interactions sociales sur les publications (likes / commentaires)
-- Corrige le blocage RLS : seul l'auteur pouvait UPDATE posts.comments et posts.likes.

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
    comments = coalesce(comments, '[]'::jsonb) || jsonb_build_array(p_comment),
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
  v_comment jsonb;
  v_comment_author text;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select * into v_post from public.posts where id = p_post_id;
  if not found then
    raise exception 'Publication introuvable';
  end if;

  select elem
  into v_comment
  from jsonb_array_elements(coalesce(v_post.comments, '[]'::jsonb)) elem
  where elem->>'id' = p_comment_id
  limit 1;

  if v_comment is null then
    return;
  end if;

  v_comment_author := coalesce(v_comment->>'authorId', v_comment->>'author_id');

  if v_comment_author <> auth.uid()::text
    and v_post.author_id::text <> auth.uid()::text
    and not public.moxt_is_admin() then
    raise exception 'Suppression non autorisée';
  end if;

  update public.posts
  set
    comments = coalesce(
      (
        select jsonb_agg(elem)
        from jsonb_array_elements(coalesce(v_post.comments, '[]'::jsonb)) elem
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

  select likes
  into v_likes
  from public.posts
  where id = p_post_id
    and status = 'published';

  if not found then
    raise exception 'Publication introuvable ou non publiée';
  end if;

  v_likes := coalesce(v_likes, '[]'::jsonb);

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

revoke all on function public.moxt_post_add_comment(text, jsonb) from public;
revoke all on function public.moxt_post_delete_comment(text, text) from public;
revoke all on function public.moxt_post_toggle_like(text) from public;

grant execute on function public.moxt_post_add_comment(text, jsonb) to authenticated;
grant execute on function public.moxt_post_delete_comment(text, text) to authenticated;
grant execute on function public.moxt_post_toggle_like(text) to authenticated;

-- Politiques posts : l'auteur gère le contenu, les interactions passent par les RPC ci-dessus.
drop policy if exists "MOXT manage own posts" on public.posts;

drop policy if exists "MOXT insert own posts" on public.posts;
create policy "MOXT insert own posts"
  on public.posts
  for insert
  to authenticated
  with check (author_id::text = (select auth.uid())::text);

drop policy if exists "MOXT update own posts" on public.posts;
create policy "MOXT update own posts"
  on public.posts
  for update
  to authenticated
  using (
    author_id::text = (select auth.uid())::text
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin')
    )
  )
  with check (
    author_id::text = (select auth.uid())::text
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin')
    )
  );

drop policy if exists "MOXT delete own posts" on public.posts;
create policy "MOXT delete own posts"
  on public.posts
  for delete
  to authenticated
  using (
    author_id::text = (select auth.uid())::text
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin')
    )
  );

-- Garantir les colonnes sociales sur posts (schéma catalogue).
alter table public.posts
  add column if not exists likes jsonb not null default '[]'::jsonb,
  add column if not exists comments jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

notify pgrst, 'reload schema';
