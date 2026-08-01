-- p2p_offers / p2p_orders n'ont que created_at. Le client appelle
-- update()/upsert avec updated_at (middleware), ce qui provoque :
-- "could not find the updated_at column of p2p_offers in the schema cache".

alter table public.p2p_offers
  add column if not exists updated_at timestamptz not null default now();

alter table public.p2p_orders
  add column if not exists updated_at timestamptz not null default now();

update public.p2p_offers
set updated_at = coalesce(updated_at, created_at, now())
where true;

update public.p2p_orders
set updated_at = coalesce(updated_at, created_at, now())
where true;

notify pgrst, 'reload schema';
