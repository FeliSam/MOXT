-- Bucket avatars : photos de profil utilisateur ({user_id}/avatar.jpg|png)

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "MOXT public avatar images" on storage.objects;
create policy "MOXT public avatar images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'avatars');

drop policy if exists "MOXT users can upload own avatar" on storage.objects;
create policy "MOXT users can upload own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "MOXT users can update own avatar" on storage.objects;
create policy "MOXT users can update own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "MOXT users can delete own avatar" on storage.objects;
create policy "MOXT users can delete own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

notify pgrst, 'reload schema';
