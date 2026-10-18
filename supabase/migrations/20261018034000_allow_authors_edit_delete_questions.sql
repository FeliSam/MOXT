-- ==============================================================================
-- Migration : Autoriser les auteurs à modifier et supprimer leurs propres questions
-- ==============================================================================

grant delete on table public.listing_questions to authenticated;

drop policy if exists "MOXT authors can update own questions" on public.listing_questions;
create policy "MOXT authors can update own questions"
on public.listing_questions
for update
to authenticated
using (
  author_id::text = (select auth.uid())::text
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'superadmin')
  )
)
with check (
  author_id::text = (select auth.uid())::text
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'superadmin')
  )
);

drop policy if exists "MOXT authors can delete own questions" on public.listing_questions;
create policy "MOXT authors can delete own questions"
on public.listing_questions
for delete
to authenticated
using (
  author_id::text = (select auth.uid())::text
  or exists (
    select 1
    from public.listings l
    where l.id = listing_questions.listing_id
      and l.owner_id::text = (select auth.uid())::text
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'superadmin')
  )
);

notify pgrst, 'reload schema';
