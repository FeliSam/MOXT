-- Cache traductions messages P2P (LibreTranslate, budget zéro API).

create table if not exists public.message_translations (
  message_id text not null references public.messages (id) on delete cascade,
  target_lang text not null check (target_lang in ('fr', 'en', 'ru', 'pt', 'es')),
  translated_text text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, target_lang)
);

create index if not exists message_translations_message_id_idx
  on public.message_translations (message_id);

alter table public.message_translations enable row level security;

drop policy if exists "MOXT participants can read message translations" on public.message_translations;
create policy "MOXT participants can read message translations"
on public.message_translations
for select
to authenticated
using (
  exists (
    select 1
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where m.id = message_translations.message_id
      and c.participant_ids ? (select auth.uid())::text
  )
);
