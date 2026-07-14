-- Legacy personal_documents may predate 20260708040000 (CREATE TABLE IF NOT EXISTS
-- does not add missing columns). Live PostgREST then rejects inserts with `url`
-- (PGRST204: Could not find the 'url' column of 'personal_documents').

alter table public.personal_documents
  add column if not exists url text;

alter table public.personal_documents
  add column if not exists category text not null default 'identity';

alter table public.personal_documents
  add column if not exists name text not null default '';

alter table public.personal_documents
  add column if not exists size integer not null default 0;

alter table public.personal_documents
  add column if not exists type text not null default 'application/octet-stream';

alter table public.personal_documents
  add column if not exists status text not null default 'pending_review';

alter table public.personal_documents
  add column if not exists created_at timestamptz not null default now();

alter table public.personal_documents
  add column if not exists deleted_at timestamptz;

alter table public.personal_documents
  add column if not exists deleted_by_user boolean not null default false;
