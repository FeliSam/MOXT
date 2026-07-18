-- Statuts "officiels MOXT" (auteur admin/superadmin) — toujours affichés en premier
-- dans le bandeau, avant même le statut de l'utilisateur courant.

alter table public.statuses
  add column if not exists is_official boolean not null default false;

create index if not exists statuses_official_idx on public.statuses (is_official desc, created_at desc);

comment on column public.statuses.is_official is
  'true si l''auteur avait le rôle admin/superadmin au moment de la publication — épinglé en tête du bandeau.';

notify pgrst, 'reload schema';
