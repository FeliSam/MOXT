-- Purge automatique des statuts expirés (>7 jours) côté serveur, via pg_cron.
-- Auparavant les statuts expirés étaient seulement masqués par RLS et filtrés
-- côté client — ils restaient indéfiniment en base.

create extension if not exists pg_cron;

create or replace function public.moxt_purge_expired_statuses()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.statuses where expires_at <= now();
$$;

select cron.schedule(
  'moxt-purge-expired-statuses',
  '0 * * * *',
  $$select public.moxt_purge_expired_statuses();$$
)
where not exists (
  select 1 from cron.job where jobname = 'moxt-purge-expired-statuses'
);
