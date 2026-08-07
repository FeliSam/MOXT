-- Avis : suppression par l'auteur (ou modérateur)

drop policy if exists "MOXT delete own reviews" on public.reviews;
create policy "MOXT delete own reviews"
  on public.reviews
  for delete
  to authenticated
  using (
    author_id::text = (select auth.uid())::text
    or public.moxt_is_moderator()
  );

notify pgrst, 'reload schema';
