-- Business documents: file storage + admin review fields + admin RLS

alter table public.business_documents
  add column if not exists url text;

alter table public.business_documents
  add column if not exists storage_path text;

alter table public.business_documents
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null;

alter table public.business_documents
  add column if not exists review_note text not null default '';

alter table public.business_documents
  add column if not exists reviewed_at timestamptz;

drop policy if exists "MOXT admin read business documents" on public.business_documents;
create policy "MOXT admin read business documents"
  on public.business_documents
  for select
  to authenticated
  using (public.moxt_is_admin());

drop policy if exists "MOXT admin update business documents" on public.business_documents;
create policy "MOXT admin update business documents"
  on public.business_documents
  for update
  to authenticated
  using (public.moxt_is_admin())
  with check (public.moxt_is_admin());
