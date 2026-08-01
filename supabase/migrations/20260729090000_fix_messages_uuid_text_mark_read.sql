-- Fix: "operator does not exist: uuid = text" when marking conversations read.
-- Wave1 messages guard compared auth.uid() (uuid) to sender_id without a safe cast
-- (breaks if sender_id was historically text, or under some PG cast paths).

create or replace function private.moxt_messages_update_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := (select auth.uid())::text;
begin
  if new.sender_id is distinct from old.sender_id then
    new.sender_id := old.sender_id;
  end if;
  if new.conversation_id is distinct from old.conversation_id then
    new.conversation_id := old.conversation_id;
  end if;

  -- Auteur : contenu libre
  if v_uid is not null and v_uid = old.sender_id::text then
    return new;
  end if;

  -- Participant non-auteur : réactions / accusés lecture / soft-delete perso uniquement
  if new.text is distinct from old.text
     or new.attachment is distinct from old.attachment
     or new.sender_name is distinct from old.sender_name
     or new.reply_to_id is distinct from old.reply_to_id then
    raise exception 'only message author can edit content';
  end if;

  return new;
end;
$$;

-- Lecture accusée côté serveur (évite un upsert client trop large à chaque ouverture).
create or replace function public.moxt_mark_conversation_read(p_conversation_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := (select auth.uid())::text;
begin
  if v_uid is null or v_uid = '' then
    raise exception 'Authentification requise';
  end if;
  if p_conversation_id is null or length(trim(p_conversation_id)) = 0 then
    return;
  end if;

  if not exists (
    select 1
    from public.conversations c
    where c.id = p_conversation_id
      and (
        private.user_participates_in_conversation(c.participant_ids)
        or private.current_user_is_admin()
      )
  ) then
    raise exception 'Conversation inaccessible';
  end if;

  update public.conversations c
  set unread_by = jsonb_set(coalesce(c.unread_by, '{}'::jsonb), array[v_uid], '0'::jsonb, true),
      updated_at = now()
  where c.id = p_conversation_id;

  update public.messages m
  set
    delivered_to = case
      when exists (
        select 1 from jsonb_array_elements_text(coalesce(m.delivered_to, '[]'::jsonb)) x where x = v_uid
      ) then coalesce(m.delivered_to, '[]'::jsonb)
      else coalesce(m.delivered_to, '[]'::jsonb) || to_jsonb(v_uid)
    end,
    read_by = case
      when exists (
        select 1 from jsonb_array_elements_text(coalesce(m.read_by, '[]'::jsonb)) x where x = v_uid
      ) then coalesce(m.read_by, '[]'::jsonb)
      else coalesce(m.read_by, '[]'::jsonb) || to_jsonb(v_uid)
    end
  where m.conversation_id = p_conversation_id
    and m.sender_id::text is distinct from v_uid;
end;
$$;

revoke all on function public.moxt_mark_conversation_read(text) from public, anon;
grant execute on function public.moxt_mark_conversation_read(text) to authenticated;

-- Harden shares_conversation_with casts (profiles SELECT when opening chats).
create or replace function private.shares_conversation_with(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.conversations c
    where c.participant_ids @> jsonb_build_array((select auth.uid())::text)
      and c.participant_ids @> jsonb_build_array(target_user_id::text)
  );
$$;

notify pgrst, 'reload schema';
