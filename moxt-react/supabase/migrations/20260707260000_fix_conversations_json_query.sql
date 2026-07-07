-- Requête fiable pour lister les conversations + normalisation JSONB.

create or replace function public.list_my_conversations(p_limit integer default 100)
returns setof public.conversations
language sql
stable
security invoker
set search_path = public
as $$
  select c.*
  from public.conversations c
  where (select private.user_participates_in_conversation(c.participant_ids))
  order by c.updated_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 200));
$$;

revoke all on function public.list_my_conversations(integer) from public, anon;
grant execute on function public.list_my_conversations(integer) to authenticated;

-- participant_ids : toujours un tableau JSON de chaînes
update public.conversations c
set participant_ids = sub.normalized
from (
  select
    id,
    coalesce(
      (
        select jsonb_agg(to_jsonb(trim(value)))
        from jsonb_array_elements_text(
          case
            when jsonb_typeof(participant_ids) = 'array' then participant_ids
            else '[]'::jsonb
          end
        ) as value
        where trim(value) <> ''
      ),
      '[]'::jsonb
    ) as normalized
  from public.conversations
) sub
where c.id = sub.id
  and c.participant_ids is distinct from sub.normalized;

-- archived_by / pinned_by / muted_by / blocked_by : tableaux JSON
update public.conversations
set archived_by = '[]'::jsonb
where jsonb_typeof(archived_by) is distinct from 'array';

update public.conversations
set pinned_by = '[]'::jsonb
where jsonb_typeof(pinned_by) is distinct from 'array';

update public.conversations
set muted_by = '[]'::jsonb
where jsonb_typeof(muted_by) is distinct from 'array';

update public.conversations
set blocked_by = '[]'::jsonb
where jsonb_typeof(blocked_by) is distinct from 'array';

-- unread_by : objet JSON
update public.conversations
set unread_by = '{}'::jsonb
where jsonb_typeof(unread_by) is distinct from 'object';

update public.conversations
set participant_profiles = '{}'::jsonb
where participant_profiles is null
   or jsonb_typeof(participant_profiles) is distinct from 'object';

notify pgrst, 'reload schema';
