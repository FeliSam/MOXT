-- Notifications: colonnes attendues par le sync client (mark read / archive).
alter table public.notifications
  add column if not exists updated_at timestamptz not null default now();

create index if not exists notifications_user_updated_idx
  on public.notifications (user_id, updated_at desc);
