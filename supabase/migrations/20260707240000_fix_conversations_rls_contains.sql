-- Corrige les politiques RLS messagerie : participant_ids est un tableau JSONB.
-- L'opérateur ? teste les clés d'objet, pas l'appartenance à un tableau.

create or replace function private.user_participates_in_conversation(participant_ids jsonb)
returns boolean
language sql
stable
as $$
  select participant_ids @> jsonb_build_array((select auth.uid())::text);
$$;

revoke all on function private.user_participates_in_conversation(jsonb) from public, anon, authenticated;
grant execute on function private.user_participates_in_conversation(jsonb) to authenticated;

drop policy if exists "MOXT participants can view conversations" on public.conversations;
create policy "MOXT participants can view conversations"
on public.conversations
for select
to authenticated
using (
  (select private.user_participates_in_conversation(participant_ids))
  or (select private.current_user_is_admin())
);

drop policy if exists "MOXT participants can create conversations" on public.conversations;
create policy "MOXT participants can create conversations"
on public.conversations
for insert
to authenticated
with check (
  (select private.user_participates_in_conversation(participant_ids))
  and created_by::text = (select auth.uid())::text
);

drop policy if exists "MOXT participants can update conversations" on public.conversations;
create policy "MOXT participants can update conversations"
on public.conversations
for update
to authenticated
using ((select private.user_participates_in_conversation(participant_ids)))
with check ((select private.user_participates_in_conversation(participant_ids)));

drop policy if exists "MOXT participants can view messages" on public.messages;
create policy "MOXT participants can view messages"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (select private.user_participates_in_conversation(c.participant_ids))
  )
);

drop policy if exists "MOXT participants can send messages" on public.messages;
create policy "MOXT participants can send messages"
on public.messages
for insert
to authenticated
with check (
  sender_id::text = (select auth.uid())::text
  and exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (select private.user_participates_in_conversation(c.participant_ids))
  )
);

drop policy if exists "MOXT participants can update own messages" on public.messages;
create policy "MOXT participants can update own messages"
on public.messages
for update
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (select private.user_participates_in_conversation(c.participant_ids))
  )
)
with check (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and (select private.user_participates_in_conversation(c.participant_ids))
  )
);

create or replace function private.shares_conversation_with(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.conversations c
    where c.participant_ids @> jsonb_build_array((select auth.uid())::text)
      and c.participant_ids @> jsonb_build_array(target_user_id::text)
  );
$$;
