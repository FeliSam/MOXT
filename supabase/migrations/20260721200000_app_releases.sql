-- Releases APK / builds mobiles : métadonnées en DB + fichiers dans storage public

create table if not exists public.app_releases (
  id text primary key,
  platform text not null check (platform in ('android', 'ios')),
  version text not null default '',
  file_name text not null default '',
  storage_path text not null,
  file_size bigint not null default 0,
  is_active boolean not null default true,
  notes text not null default '',
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_releases_platform_active_idx
  on public.app_releases (platform, is_active, created_at desc);

alter table public.app_releases enable row level security;

drop policy if exists "MOXT read active app releases" on public.app_releases;
create policy "MOXT read active app releases"
on public.app_releases
for select
to anon, authenticated
using (is_active = true or public.moxt_is_moderator());

drop policy if exists "MOXT staff manage app releases" on public.app_releases;
create policy "MOXT staff manage app releases"
on public.app_releases
for all
to authenticated
using (public.moxt_is_moderator())
with check (public.moxt_is_moderator());

grant select on public.app_releases to anon, authenticated;
grant select, insert, update, delete on public.app_releases to authenticated;

-- Bucket public pour téléchargement direct de l'APK
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'app-releases',
  'app-releases',
  true,
  209715200,
  array[
    'application/vnd.android.package-archive',
    'application/octet-stream',
    'application/zip'
  ]
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "MOXT public read app releases" on storage.objects;
create policy "MOXT public read app releases"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'app-releases');

drop policy if exists "MOXT staff upload app releases" on storage.objects;
create policy "MOXT staff upload app releases"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'app-releases' and public.moxt_is_moderator());

drop policy if exists "MOXT staff update app releases files" on storage.objects;
create policy "MOXT staff update app releases files"
on storage.objects
for update
to authenticated
using (bucket_id = 'app-releases' and public.moxt_is_moderator())
with check (bucket_id = 'app-releases' and public.moxt_is_moderator());

drop policy if exists "MOXT staff delete app releases files" on storage.objects;
create policy "MOXT staff delete app releases files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'app-releases' and public.moxt_is_moderator());

notify pgrst, 'reload schema';
