insert into storage.buckets (id, name, public)
values ('businesses', 'businesses', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "MOXT public business images" on storage.objects;
create policy "MOXT public business images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'businesses');

drop policy if exists "MOXT users can upload own business images" on storage.objects;
create policy "MOXT users can upload own business images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'businesses'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "MOXT users can update own business images" on storage.objects;
create policy "MOXT users can update own business images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'businesses'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'businesses'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "MOXT users can delete own business images" on storage.objects;
create policy "MOXT users can delete own business images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'businesses'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

notify pgrst, 'reload schema';
