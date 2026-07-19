alter table public.profiles
  add column if not exists last_active_at timestamptz not null default now();

comment on column public.profiles.last_active_at is 'Dernier heartbeat client (presence realtime) — distinct de updated_at.';

notify pgrst, 'reload schema';
