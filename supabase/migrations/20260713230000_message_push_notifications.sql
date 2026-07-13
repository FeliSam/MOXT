-- Push notifications pour les nouveaux messages (Safari PWA / Web Push).
-- SECURITY DEFINER : contourne le RLS (un utilisateur ne peut pas insérer
-- une notification pour un autre via le client).

create or replace function public.moxt_notify_recipients_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conv record;
  recipient_text text;
  notif_id text;
  preview text;
  sender_label text;
begin
  select *
    into conv
  from public.conversations
  where id = new.conversation_id;

  if not found then
    return new;
  end if;

  sender_label := coalesce(nullif(trim(new.sender_name), ''), 'Nouveau message');
  preview := left(
    coalesce(
      nullif(trim(new.text), ''),
      case
        when new.attachment is not null then 'Pièce jointe'
        else 'Nouveau message'
      end
    ),
    140
  );

  for recipient_text in
    select value
    from jsonb_array_elements_text(coalesce(conv.participant_ids, '[]'::jsonb)) as t(value)
    where value is not null
      and value <> ''
      and value <> new.sender_id::text
      -- conversation en sourdine pour ce destinataire
      and not (coalesce(conv.muted_by, '[]'::jsonb) ? value)
      -- conversation bloquée par ce destinataire
      and not (coalesce(conv.blocked_by, '[]'::jsonb) ? value)
  loop
    notif_id := 'msg_' || new.id || '_' || recipient_text;

    insert into public.notifications (
      id,
      user_id,
      title,
      message,
      type,
      link,
      priority,
      read,
      archived,
      created_at
    )
    values (
      notif_id,
      recipient_text::uuid,
      sender_label,
      preview,
      'message',
      '/messages?conversation=' || new.conversation_id,
      'high',
      false,
      false,
      coalesce(new.created_at, now())
    )
    on conflict (id) do nothing;
  end loop;

  return new;
exception
  when others then
    -- Ne jamais bloquer l’envoi du message si la notif échoue
    return new;
end;
$$;

drop trigger if exists messages_notify_recipients on public.messages;
create trigger messages_notify_recipients
  after insert on public.messages
  for each row
  execute function public.moxt_notify_recipients_on_message();

notify pgrst, 'reload schema';
