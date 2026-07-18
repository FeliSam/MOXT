-- Langue d'affichage du fil d'actualités (fr, en, ru, pt, es).
alter table public.posts
  add column if not exists language text;

alter table public.posts
  add column if not exists pinned boolean not null default false;

create index if not exists posts_language_status_idx
  on public.posts (language, status);

comment on column public.posts.language is 'UI locale for news feed filtering';
comment on column public.posts.pinned is 'Pinned posts stay at top of the news feed for all users';
