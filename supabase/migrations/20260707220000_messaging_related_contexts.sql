-- Historique des annonces liées à une conversation (fil chronologique).

alter table public.conversations
  add column if not exists related_contexts jsonb not null default '[]'::jsonb;

update public.conversations
set related_contexts = jsonb_build_array(
  jsonb_build_object(
    'id', 'CTX-legacy-' || coalesce(related_id, id),
    'related_type', related_type,
    'related_id', related_id,
    'related_path', related_path,
    'related_snapshot', related_snapshot,
    'introduced_at', coalesce(created_at, updated_at, now()),
    'introduced_by', created_by
  )
)
where jsonb_array_length(related_contexts) = 0
  and related_snapshot is not null
  and related_id is not null;
