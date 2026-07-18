-- Align legacy support_tickets with app schema (messages + related columns)
alter table public.support_tickets
  add column if not exists user_name text not null default '';

alter table public.support_tickets
  add column if not exists subject text not null default '';

alter table public.support_tickets
  add column if not exists priority text not null default 'normal';

alter table public.support_tickets
  add column if not exists category text not null default 'other';

alter table public.support_tickets
  add column if not exists status text not null default 'waiting_agent';

alter table public.support_tickets
  add column if not exists messages jsonb not null default '[]'::jsonb;

alter table public.support_tickets
  add column if not exists assigned_to uuid references auth.users (id);

alter table public.support_tickets
  add column if not exists created_at timestamptz not null default now();

alter table public.support_tickets
  add column if not exists updated_at timestamptz not null default now();

notify pgrst, 'reload schema';
