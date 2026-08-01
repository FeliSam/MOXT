-- Restore community profile SELECT needed for avatars/names on dashboard, feeds,
-- subscriptions, reviews (Wave 3 dropped "using (true)" and broke enrichment).
-- Phone/email remain non-writable by peers (privilege guards from Wave 1).
-- Authenticated users can read profile rows for UI display; sensitive writes stay locked.

drop policy if exists "MOXT read community profile basics" on public.profiles;
create policy "MOXT read community profile basics"
  on public.profiles
  for select
  to authenticated
  using (true);

-- Ensure KYC document owners can read/write their own storage objects
-- (admin SELECT already exists; owner policies were missing from migrations).
drop policy if exists "MOXT users read own documents storage" on storage.objects;
create policy "MOXT users read own documents storage"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "MOXT users upload own documents storage" on storage.objects;
create policy "MOXT users upload own documents storage"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "MOXT users update own documents storage" on storage.objects;
create policy "MOXT users update own documents storage"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "MOXT users delete own documents storage" on storage.objects;
create policy "MOXT users delete own documents storage"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

notify pgrst, 'reload schema';
