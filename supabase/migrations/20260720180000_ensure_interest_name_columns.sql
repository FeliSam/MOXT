-- Ensure interest/request name columns exist (PostgREST schema cache).
alter table public.job_applications
  add column if not exists applicant_name text not null default '';

alter table public.parcel_requests
  add column if not exists requester_name text not null default '';

alter table public.event_registrations
  add column if not exists participant_name text not null default '';

notify pgrst, 'reload schema';
