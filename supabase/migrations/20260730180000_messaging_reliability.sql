-- Messaging reliability: edited_at, mark-read without bumping list order.

alter table public.messages
  add column if not exists edited_at timestamptz;

-- Opening a chat must not reorder the inbox (updated_at stays on real activity).
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
  set unread_by = jsonb_set(coalesce(c.unread_by, '{}'::jsonb), array[v_uid], '0'::jsonb, true)
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

notify pgrst, 'reload schema';
