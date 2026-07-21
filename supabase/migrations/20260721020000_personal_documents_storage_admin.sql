-- Persist durable storage path + allow admins to re-sign private document URLs.

alter table public.personal_documents
  add column if not exists storage_path text;

-- Backfill path from expired signed URLs when possible (pathname after /documents/).
update public.personal_documents
set storage_path = substring(
  url
  from '(?:/object/(?:sign|authenticated|public)/documents/)([^?]+)'
)
where storage_path is null
  and url is not null
  and url ~ '/object/(sign|authenticated|public)/documents/';

drop policy if exists "MOXT admin read documents storage" on storage.objects;
create policy "MOXT admin read documents storage"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documents'
    and public.moxt_is_admin()
  );

notify pgrst, 'reload schema';
