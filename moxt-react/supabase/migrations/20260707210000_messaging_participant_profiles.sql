-- Profils participants stockés sur la conversation + lecture des profils des co-participants.

alter table public.conversations
  add column if not exists participant_profiles jsonb not null default '{}'::jsonb;

drop policy if exists "MOXT users can read messaging participant profiles" on public.profiles;
create policy "MOXT users can read messaging participant profiles"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
  or exists (
    select 1
    from public.conversations c
    where c.participant_ids @> to_jsonb((select auth.uid())::text)
      and c.participant_ids @> to_jsonb(profiles.id::text)
  )
);
