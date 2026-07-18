-- Détail des vues (qui a vu, avec nom/avatar) et réactions rapides (emoji)
-- sur les statuts, en complément de viewed_by (liste d'ids simple).

alter table public.statuses
  add column if not exists viewers jsonb not null default '{}'::jsonb,
  add column if not exists reactions jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
