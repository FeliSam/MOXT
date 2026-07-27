-- Les entreprises ne peuvent pas encore publier de statuts (façon story) —
-- seul un compte personnel le peut. On ajoute business_id (même convention
-- que listings/jobs : colonne texte libre, pas de FK dure) pour permettre à
-- un propriétaire d'entreprise de publier "en tant que" son entreprise.

alter table public.statuses add column if not exists business_id text;

create index if not exists statuses_business_idx
  on public.statuses (business_id)
  where business_id is not null;

drop policy if exists "MOXT create own statuses" on public.statuses;
create policy "MOXT create own statuses" on public.statuses for insert to authenticated
  with check (
    author_id::text = (select auth.uid())::text
    and (business_id is null or public.moxt_owns_business(business_id))
  );

notify pgrst, 'reload schema';
