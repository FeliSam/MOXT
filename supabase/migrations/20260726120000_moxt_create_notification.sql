-- Peer notifications: authenticated users can insert a notification for another
-- user via SECURITY DEFINER (RLS only allows managing own rows).

create or replace function public.moxt_create_notification(
  p_id text,
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text default 'system',
  p_link text default null,
  p_priority text default 'normal'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_user_id is null then
    raise exception 'user_id required';
  end if;

  if coalesce(nullif(trim(p_id), ''), '') = '' then
    raise exception 'id required';
  end if;

  if coalesce(nullif(trim(p_title), ''), '') = '' then
    raise exception 'title required';
  end if;

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
    p_id,
    p_user_id,
    left(trim(p_title), 200),
    left(coalesce(p_message, ''), 500),
    coalesce(nullif(trim(p_type), ''), 'system'),
    nullif(trim(p_link), ''),
    case
      when p_priority in ('high', 'normal', 'low') then p_priority
      else 'normal'
    end,
    false,
    false,
    now()
  )
  on conflict (id) do nothing;
end;
$$;

revoke all on function public.moxt_create_notification(text, uuid, text, text, text, text, text) from public;
grant execute on function public.moxt_create_notification(text, uuid, text, text, text, text, text) to authenticated;
