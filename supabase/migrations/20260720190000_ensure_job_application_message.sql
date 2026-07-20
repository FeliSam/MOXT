-- Ensure job_applications.message exists (PostgREST schema cache).
alter table public.job_applications
  add column if not exists message text not null default '';

notify pgrst, 'reload schema';
