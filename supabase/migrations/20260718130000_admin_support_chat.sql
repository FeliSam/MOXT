-- Fix legacy support_tickets missing category + admin access to support chats

alter table public.support_tickets
  add column if not exists category text not null default 'other';

-- Admins can update support conversations (claim / unread / archive)
drop policy if exists "MOXT admin update support conversations" on public.conversations;
create policy "MOXT admin update support conversations"
on public.conversations
for update
to authenticated
using (
  related_type = 'support'
  and (select private.current_user_is_admin())
)
with check (
  related_type = 'support'
  and (select private.current_user_is_admin())
);

-- Admins can read messages on support conversations even if not yet participants
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
      and (
        (select private.user_participates_in_conversation(c.participant_ids))
        or (
          c.related_type = 'support'
          and (select private.current_user_is_admin())
        )
      )
  )
);

-- Admins can reply on support conversations
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
      and (
        (select private.user_participates_in_conversation(c.participant_ids))
        or (
          c.related_type = 'support'
          and (select private.current_user_is_admin())
        )
      )
  )
);

-- List support inbox for admins
create or replace function public.list_support_conversations(p_limit integer default 100)
returns setof public.conversations
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.current_user_is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  select *
  from public.conversations c
  where c.related_type = 'support'
  order by c.updated_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 200));
end;
$$;

revoke all on function public.list_support_conversations(integer) from public, anon;
grant execute on function public.list_support_conversations(integer) to authenticated;

-- Secure admin picker for regular users opening a support chat
create or replace function public.moxt_pick_support_admin()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id
  from public.profiles
  where role in ('admin', 'superadmin')
    and coalesce(status, 'active') not in ('suspended', 'pending_deletion')
    and id is distinct from (select auth.uid())
  order by case when role = 'superadmin' then 0 else 1 end, created_at asc
  limit 1;
$$;

revoke all on function public.moxt_pick_support_admin() from public, anon;
grant execute on function public.moxt_pick_support_admin() to authenticated;

notify pgrst, 'reload schema';
