-- Page d'aide aux étudiants / étrangers en Russie : articles gérés par un
-- espace admin léger (documents, vie étudiante, argent, sécurité, lois),
-- chaque article pouvant pointer vers une source officielle + une date de
-- vérification, plutôt que de prétendre à une mise à jour automatique par API
-- (aucune API publique officielle n'existe pour ce type de contenu).

create table if not exists public.help_articles (
  id text primary key,
  category text not null default 'documents',
  language text not null default 'fr',
  title text not null default '',
  summary text not null default '',
  content text not null default '',
  source_name text,
  source_url text,
  verified_at timestamptz,
  pinned boolean not null default false,
  status text not null default 'draft',
  author_id uuid references auth.users (id) on delete set null,
  author_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists help_articles_category_idx on public.help_articles (category);
create index if not exists help_articles_language_idx on public.help_articles (language);
create index if not exists help_articles_status_idx on public.help_articles (status);

alter table public.help_articles enable row level security;

drop policy if exists "MOXT read published help articles" on public.help_articles;
create policy "MOXT read published help articles" on public.help_articles for select to authenticated using (
  status = 'published'
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin', 'moderator'))
);

drop policy if exists "MOXT staff manage help articles" on public.help_articles;
create policy "MOXT staff manage help articles" on public.help_articles for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin', 'moderator')))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin', 'moderator')));

grant select, insert, update, delete on public.help_articles to authenticated;

notify pgrst, 'reload schema';
