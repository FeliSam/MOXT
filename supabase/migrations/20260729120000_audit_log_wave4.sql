-- Wave 4 : audit log métier immuable
-- Table séparée de moxt_security_events (réseau/rate-limit) pour tracer
-- les actions métier importantes (transfert, KYC, suspension, rôle…).

create table if not exists public.moxt_audit_log (
  id          bigserial primary key,
  actor_id    uuid,
  actor_role  text,
  action      text not null,
  target_id   text,
  target_type text,
  payload     jsonb default '{}',
  created_at  timestamptz default now()
);

-- Index pour les requêtes admin (tri chronologique et filtrage par acteur)
create index if not exists moxt_audit_log_created_at_idx on public.moxt_audit_log (created_at desc);
create index if not exists moxt_audit_log_actor_id_idx   on public.moxt_audit_log (actor_id);

-- RLS : lecture réservée aux admins ; pas d'update/delete (immuabilité garantie par RLS)
alter table public.moxt_audit_log enable row level security;

create policy "moxt_audit_log_admin_select"
  on public.moxt_audit_log
  for select
  to authenticated
  using (public.moxt_is_admin());

-- Aucune policy insert/update/delete directe — tout passe par la fonction SECURITY DEFINER.

-- Fonction d'écriture : seul vecteur d'insertion, exécutée avec les droits du owner.
create or replace function public.moxt_write_audit_event(
  p_actor_id    uuid,
  p_actor_role  text,
  p_action      text,
  p_target_id   text,
  p_target_type text,
  p_payload     jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.moxt_audit_log
    (actor_id, actor_role, action, target_id, target_type, payload)
  values
    (p_actor_id, p_actor_role, p_action, p_target_id, p_target_type, coalesce(p_payload, '{}'));
end;
$$;

-- Autorise les utilisateurs authentifiés à appeler la fonction
grant execute on function public.moxt_write_audit_event(uuid, text, text, text, text, jsonb)
  to authenticated;
