alter table public.help_articles
  add column if not exists translation_group_id text;

update public.help_articles set translation_group_id = id where translation_group_id is null;

alter table public.help_articles alter column translation_group_id set not null;

create index if not exists help_articles_translation_group_idx on public.help_articles (translation_group_id);

notify pgrst, 'reload schema';
