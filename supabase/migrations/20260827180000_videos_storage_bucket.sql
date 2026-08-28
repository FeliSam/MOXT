-- Bucket public pour les vidéos entreprise (feed / catalogue)
-- Chemins : {businessId}/{videoId}.{ext} (+ éventuel -thumb.jpg)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  true,
  230686720, -- 220 Mo (aligné sur la limite client)
  array[
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-m4v',
    'video/m4v',
    'video/3gpp',
    'video/3gpp2',
    'video/x-matroska',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lecture publique (feed invité + CDN)
drop policy if exists "MOXT public video objects" on storage.objects;
create policy "MOXT public video objects"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'videos');

-- Upload / update / delete : propriétaire authentifié (1er segment = auth.uid(), cf. listings)
drop policy if exists "MOXT owners upload business videos" on storage.objects;
create policy "MOXT owners upload business videos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "MOXT owners update business videos" on storage.objects;
create policy "MOXT owners update business videos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "MOXT owners delete business videos" on storage.objects;
create policy "MOXT owners delete business videos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

notify pgrst, 'reload schema';
