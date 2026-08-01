-- Admin staff can read transfer proof files in storage (moderation / support).

drop policy if exists "MOXT admin read transfers storage" on storage.objects;
create policy "MOXT admin read transfers storage"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'transfers'
    and public.moxt_is_admin()
  );

notify pgrst, 'reload schema';
