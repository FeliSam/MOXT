-- MOXT media registry (PostgreSQL) — fichiers sur Yandex Object Storage
-- Les blobs ne sont jamais stockés ici, seulement métadonnées + droits.

create table if not exists public.media_objects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('avatar', 'image', 'video', 'document', 'proof')),
  visibility text not null check (visibility in ('public', 'private')),
  bucket text not null,
  object_key text not null,
  mime_type text not null default 'application/octet-stream',
  byte_size bigint,
  width int,
  height int,
  duration_ms int,
  checksum_sha256 text,
  entity_type text,
  entity_id text,
  status text not null default 'pending' check (status in ('pending', 'ready', 'deleted', 'error')),
  legacy_supabase_bucket text,
  legacy_supabase_path text,
  legacy_supabase_url text,
  public_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (bucket, object_key)
);

create index if not exists media_objects_owner_idx on public.media_objects (owner_id);
create index if not exists media_objects_entity_idx on public.media_objects (entity_type, entity_id);
create index if not exists media_objects_status_idx on public.media_objects (status);
create index if not exists media_objects_expires_idx on public.media_objects (expires_at)
  where expires_at is not null;

alter table public.media_objects enable row level security;

drop policy if exists "MOXT media public read" on public.media_objects;
create policy "MOXT media public read"
  on public.media_objects
  for select
  to anon, authenticated
  using (visibility = 'public' and status = 'ready');

drop policy if exists "MOXT media owner read" on public.media_objects;
create policy "MOXT media owner read"
  on public.media_objects
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "MOXT media admin read" on public.media_objects;
create policy "MOXT media admin read"
  on public.media_objects
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'superadmin')
    )
  );

-- Pas d'INSERT/UPDATE direct client : Edge Function media-api (service role).

create or replace function public.moxt_touch_media_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists media_objects_updated_at on public.media_objects;
create trigger media_objects_updated_at
  before update on public.media_objects
  for each row
  execute function public.moxt_touch_media_updated_at();

create or replace function public.moxt_media_finalize(
  p_media_id uuid,
  p_byte_size bigint default null,
  p_checksum_sha256 text default null,
  p_public_url text default null,
  p_width int default null,
  p_height int default null,
  p_duration_ms int default null
)
returns public.media_objects
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.media_objects;
begin
  update public.media_objects
  set
    status = 'ready',
    byte_size = coalesce(p_byte_size, byte_size),
    checksum_sha256 = coalesce(p_checksum_sha256, checksum_sha256),
    public_url = coalesce(p_public_url, public_url),
    width = coalesce(p_width, width),
    height = coalesce(p_height, height),
    duration_ms = coalesce(p_duration_ms, duration_ms),
    updated_at = now()
  where id = p_media_id
    and owner_id = auth.uid()
    and status = 'pending'
  returning * into row;

  if row.id is null then
    raise exception 'media_finalize_forbidden_or_missing';
  end if;

  return row;
end;
$$;

revoke all on function public.moxt_media_finalize(uuid, bigint, text, text, int, int, int) from public;
grant execute on function public.moxt_media_finalize(uuid, bigint, text, text, int, int, int) to authenticated;

create or replace function public.moxt_media_mark_deleted(p_media_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.media_objects
  set status = 'deleted', updated_at = now()
  where id = p_media_id
    and owner_id = auth.uid()
    and status <> 'deleted';
  return found;
end;
$$;

revoke all on function public.moxt_media_mark_deleted(uuid) from public;
grant execute on function public.moxt_media_mark_deleted(uuid) to authenticated;

notify pgrst, 'reload schema';
