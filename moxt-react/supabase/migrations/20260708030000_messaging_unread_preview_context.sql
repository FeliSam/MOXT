-- Messagerie : contexte de réponse, aperçu dernier message, sync liste

-- Réponse liée à une annonce / contexte
alter table public.messages add column if not exists related_context_id text;

-- Aperçu dans la liste des conversations (sans charger les messages)
alter table public.conversations add column if not exists last_message_text text;
alter table public.conversations add column if not exists last_message_sender_id text;
alter table public.conversations add column if not exists last_message_at timestamptz;

-- Rétro-remplissage depuis les messages existants
update public.conversations c
set
  last_message_text = sub.text,
  last_message_sender_id = sub.sender_id::text,
  last_message_at = sub.created_at
from (
  select distinct on (conversation_id)
    conversation_id,
    text,
    sender_id,
    created_at
  from public.messages
  order by conversation_id, created_at desc
) sub
where c.id = sub.conversation_id;

create or replace function public.sync_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set
    last_message_text = new.text,
    last_message_sender_id = new.sender_id::text,
    last_message_at = new.created_at,
    updated_at = new.created_at,
    message_count = (
      select count(*)::integer
      from public.messages m
      where m.conversation_id = new.conversation_id
    )
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_sync_conversation_last on public.messages;
create trigger messages_sync_conversation_last
after insert on public.messages
for each row
execute function public.sync_conversation_last_message();

notify pgrst, 'reload schema';
