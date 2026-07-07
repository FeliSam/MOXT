-- Corrige la récursion infinie profiles ↔ conversations dans les politiques RLS.
-- profiles lisait conversations ; conversations lisait profiles (rôle admin).

create or replace function private.current_user_is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('admin', 'superadmin')
  );
$$;

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
    where c.participant_ids @> to_jsonb((select auth.uid())::text)
      and c.participant_ids @> to_jsonb(target_user_id::text)
  );
$$;

revoke all on function private.current_user_is_admin() from public, anon, authenticated;
revoke all on function private.shares_conversation_with(uuid) from public, anon, authenticated;
grant execute on function private.current_user_is_admin() to authenticated;
grant execute on function private.shares_conversation_with(uuid) to authenticated;

drop policy if exists "MOXT users can read messaging participant profiles" on public.profiles;
create policy "MOXT users can read messaging participant profiles"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
  or (select private.shares_conversation_with(profiles.id))
);

drop policy if exists "MOXT participants can view conversations" on public.conversations;
create policy "MOXT participants can view conversations"
on public.conversations
for select
to authenticated
using (
  participant_ids ? (select auth.uid())::text
  or (select private.current_user_is_admin())
);
