alter table public.support_tickets
  add column if not exists category text not null default 'other';

notify pgrst, 'reload schema';
