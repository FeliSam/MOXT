-- Vidéos entreprise (catalogue + feed dédié)

create table if not exists public.videos (
  id text primary key,
  business_id text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  caption text not null default '',
  video_url text not null default '',
  thumbnail_url text not null default '',
  object_key text not null default '',
  duration_ms integer not null default 0,
  status text not null default 'active'
    check (status in ('active', 'archived', 'pending_review', 'draft')),
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists videos_business_status_created_idx
  on public.videos (business_id, status, created_at desc);

create index if not exists videos_status_created_idx
  on public.videos (status, created_at desc);

create index if not exists videos_owner_idx
  on public.videos (owner_id);

alter table public.videos enable row level security;

drop policy if exists "MOXT read videos" on public.videos;
create policy "MOXT read videos" on public.videos
for select
to authenticated
using (
  status = 'active'
  or owner_id = (select auth.uid())
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT manage own videos" on public.videos;
create policy "MOXT manage own videos" on public.videos
for all
to authenticated
using (
  owner_id = (select auth.uid())
  or public.moxt_is_moderator()
)
with check (owner_id = (select auth.uid()));

drop policy if exists "MOXT anon read active videos" on public.videos;
create policy "MOXT anon read active videos" on public.videos
for select
to anon
using (status = 'active');

grant select on table public.videos to anon;
grant select, insert, update, delete on table public.videos to authenticated;
