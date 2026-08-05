-- Cache traductions par hash de contenu (dédoublonnage cross-messages).

create table if not exists public.translation_content_cache (
  content_hash text not null,
  target_lang text not null check (target_lang in ('fr', 'en', 'ru', 'pt', 'es')),
  source_lang text,
  translated_text text not null,
  created_at timestamptz not null default now(),
  primary key (content_hash, target_lang)
);

create index if not exists translation_content_cache_target_idx
  on public.translation_content_cache (target_lang);

alter table public.translation_content_cache enable row level security;

drop policy if exists "MOXT authenticated can read translation content cache" on public.translation_content_cache;
create policy "MOXT authenticated can read translation content cache"
on public.translation_content_cache
for select
to authenticated
using (true);
