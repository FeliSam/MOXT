-- Signalements : preuve visuelle
alter table public.listing_reports
  add column if not exists evidence_url text;

alter table public.job_reports
  add column if not exists evidence_url text;

alter table public.event_reports
  add column if not exists evidence_url text;

alter table public.subscriber_reports
  add column if not exists evidence_url text;

-- Conservation des docs utilisateur côté admin (soft-delete)
alter table public.personal_documents
  add column if not exists deleted_at timestamptz;

alter table public.personal_documents
  add column if not exists deleted_by_user boolean not null default false;

-- Lecteurs admin / superadmin des documents personnelsements
drop policy if exists "MOXT admin read personal documents" on public.personal_documents;
create policy "MOXT admin read personal documents"
  on public.personal_documents
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
