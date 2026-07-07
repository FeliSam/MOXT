-- MOXT — messagerie (conversations + messages normalisés)
-- Une conversation unique par combinaison de participants (participant_key).

create table if not exists public.conversations (
  id text primary key,
  title text not null default '',
  related_type text,
  related_id text,
  related_path text,
  participant_ids jsonb not null default '[]'::jsonb,
  participant_key text,
  created_by uuid references auth.users (id) on delete set null,
  status text not null default 'active',
  unread_by jsonb not null default '{}'::jsonb,
  archived_by jsonb not null default '[]'::jsonb,
  pinned_by jsonb not null default '[]'::jsonb,
  muted_by jsonb not null default '[]'::jsonb,
  blocked_by jsonb not null default '[]'::jsonb,
  message_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table déjà existante en prod : ajouter les colonnes manquantes
alter table public.conversations add column if not exists title text not null default '';
alter table public.conversations add column if not exists related_type text;
alter table public.conversations add column if not exists related_id text;
alter table public.conversations add column if not exists related_path text;
alter table public.conversations add column if not exists participant_ids jsonb not null default '[]'::jsonb;
alter table public.conversations add column if not exists participant_key text;
alter table public.conversations add column if not exists created_by uuid;
alter table public.conversations add column if not exists status text not null default 'active';
alter table public.conversations add column if not exists unread_by jsonb not null default '{}'::jsonb;
alter table public.conversations add column if not exists archived_by jsonb not null default '[]'::jsonb;
alter table public.conversations add column if not exists pinned_by jsonb not null default '[]'::jsonb;
alter table public.conversations add column if not exists muted_by jsonb not null default '[]'::jsonb;
alter table public.conversations add column if not exists blocked_by jsonb not null default '[]'::jsonb;
alter table public.conversations add column if not exists message_count integer not null default 0;
alter table public.conversations add column if not exists created_at timestamptz not null default now();
alter table public.conversations add column if not exists updated_at timestamptz not null default now();
alter table public.conversations add column if not exists related_snapshot jsonb;

update public.conversations
set message_count = coalesce(message_count, 0)
where message_count is null;

update public.conversations
set participant_key = (
  select string_agg(value, ':' order by value)
  from jsonb_array_elements_text(participant_ids) as value
)
where (participant_key is null or participant_key = '')
  and jsonb_array_length(participant_ids) > 0;

-- Conversations sans participants valides : clé unique par id
update public.conversations
set participant_key = id
where participant_key is null or participant_key = '';

-- Fusionner les doublons seulement s'il y en a
do $$
begin
  if exists (
    select participant_key
    from public.conversations
    where participant_key is not null and participant_key <> ''
    group by participant_key
    having count(*) > 1
  ) then
    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public' and table_name = 'messages'
    ) then
      with ranked as (
        select
          conversation_row.id,
          conversation_row.participant_key,
          row_number() over (
            partition by conversation_row.participant_key
            order by
              conversation_row.updated_at desc nulls last,
              conversation_row.created_at desc nulls last,
              conversation_row.id
          ) as rn
        from public.conversations conversation_row
      ),
      mapping as (
        select duplicate.id as from_id, keeper.id as to_id
        from ranked duplicate
        join ranked keeper
          on keeper.participant_key = duplicate.participant_key
         and keeper.rn = 1
        where duplicate.rn > 1
      )
      update public.messages message_row
      set conversation_id = mapping.to_id
      from mapping
      where message_row.conversation_id = mapping.from_id;
    end if;

    with ranked as (
      select
        conversation_row.id,
        conversation_row.participant_key,
        row_number() over (
          partition by conversation_row.participant_key
          order by
            conversation_row.updated_at desc nulls last,
            conversation_row.created_at desc nulls last,
            conversation_row.id
        ) as rn
      from public.conversations conversation_row
    )
    delete from public.conversations conversation_row
    using ranked
    where conversation_row.id = ranked.id
      and ranked.rn > 1;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'conversations'
      and column_name = 'participant_key'
      and is_nullable = 'YES'
  ) then
    alter table public.conversations
      alter column participant_key set not null;
  end if;
end $$;

create unique index if not exists conversations_participant_key_idx
  on public.conversations (participant_key);

create index if not exists conversations_participant_ids_idx
  on public.conversations using gin (participant_ids);

create index if not exists conversations_updated_at_idx
  on public.conversations (updated_at desc);

create table if not exists public.messages (
  id text primary key,
  conversation_id text not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  sender_name text not null default '',
  text text not null default '',
  attachment jsonb,
  reply_to_id text,
  reactions jsonb not null default '{}'::jsonb,
  deleted_by jsonb not null default '[]'::jsonb,
  delivered_to jsonb not null default '[]'::jsonb,
  read_by jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.messages add column if not exists sender_name text not null default '';
alter table public.messages add column if not exists text text not null default '';
alter table public.messages add column if not exists attachment jsonb;
alter table public.messages add column if not exists reply_to_id text;
alter table public.messages add column if not exists reactions jsonb not null default '{}'::jsonb;
alter table public.messages add column if not exists deleted_by jsonb not null default '[]'::jsonb;
alter table public.messages add column if not exists delivered_to jsonb not null default '[]'::jsonb;
alter table public.messages add column if not exists read_by jsonb not null default '[]'::jsonb;
alter table public.messages add column if not exists created_at timestamptz not null default now();

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.conversations replica identity full;
alter table public.messages replica identity full;

-- ── conversations RLS ────────────────────────────────────────────────────────

drop policy if exists "MOXT participants can view conversations" on public.conversations;
create policy "MOXT participants can view conversations"
on public.conversations
for select
to authenticated
using (
  participant_ids ? (select auth.uid())::text
  or exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin', 'superadmin')
  )
);

drop policy if exists "MOXT participants can create conversations" on public.conversations;
create policy "MOXT participants can create conversations"
on public.conversations
for insert
to authenticated
with check (
  participant_ids ? (select auth.uid())::text
  and created_by::text = (select auth.uid())::text
);

drop policy if exists "MOXT participants can update conversations" on public.conversations;
create policy "MOXT participants can update conversations"
on public.conversations
for update
to authenticated
using (participant_ids ? (select auth.uid())::text)
with check (participant_ids ? (select auth.uid())::text);

-- ── messages RLS ─────────────────────────────────────────────────────────────

drop policy if exists "MOXT participants can view messages" on public.messages;
create policy "MOXT participants can view messages"
on public.messages
for select
to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and c.participant_ids ? (select auth.uid())::text
  )
);

drop policy if exists "MOXT participants can send messages" on public.messages;
create policy "MOXT participants can send messages"
on public.messages
for insert
to authenticated
with check (
  sender_id::text = (select auth.uid())::text
  and exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and c.participant_ids ? (select auth.uid())::text
  )
);

drop policy if exists "MOXT participants can update own messages" on public.messages;
create policy "MOXT participants can update own messages"
on public.messages
for update
to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and c.participant_ids ? (select auth.uid())::text
  )
)
with check (
  exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and c.participant_ids ? (select auth.uid())::text
  )
);

grant select, insert, update on table public.conversations to authenticated;
grant select, insert, update on table public.messages to authenticated;

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;

notify pgrst, 'reload schema';
