-- Rétention des documents d'identité (personnes + entreprises) et nettoyage
-- des fichiers orphelins.
--
-- Contexte légal : la loi fédérale 115-ФЗ (art. 7 §4) impose de conserver les
-- documents d'identification du client AU MOINS 5 ANS à compter de la fin de
-- la relation client. On ne supprime donc PAS les documents après validation :
-- on pose une rétention légale explicite, et seule son expiration autorise
-- une purge. Un document sous rétention ne peut pas être purgé par erreur.

-- ── 1. Rétention légale ────────────────────────────────────────────────────
alter table public.personal_documents
  add column if not exists legal_hold_until timestamptz;

alter table public.business_documents
  add column if not exists legal_hold_until timestamptz;

comment on column public.personal_documents.legal_hold_until is
  'Date avant laquelle le document ne peut pas être purgé (115-ФЗ art.7 §4 : 5 ans).';
comment on column public.business_documents.legal_hold_until is
  'Date avant laquelle le document ne peut pas être purgé (115-ФЗ art.7 §4 : 5 ans).';

-- Pose la rétention à la création, et la prolonge quand un document est validé.
create or replace function public.moxt_set_document_legal_hold()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.legal_hold_until is null then
    new.legal_hold_until := coalesce(new.created_at, now()) + interval '5 years';
  end if;
  return new;
end;
$$;

drop trigger if exists personal_documents_legal_hold on public.personal_documents;
create trigger personal_documents_legal_hold
  before insert on public.personal_documents
  for each row
  execute function public.moxt_set_document_legal_hold();

drop trigger if exists business_documents_legal_hold on public.business_documents;
create trigger business_documents_legal_hold
  before insert on public.business_documents
  for each row
  execute function public.moxt_set_document_legal_hold();

-- Rétroactif : les documents déjà présents n'avaient pas de rétention.
update public.personal_documents
set legal_hold_until = coalesce(created_at, now()) + interval '5 years'
where legal_hold_until is null;

update public.business_documents
set legal_hold_until = coalesce(created_at, now()) + interval '5 years'
where legal_hold_until is null;

-- ── 2. Purge autorisée uniquement après expiration de la rétention ─────────
-- Renvoie les chemins de stockage à supprimer : l'appelant (tâche admin)
-- supprime ensuite les objets correspondants dans le bucket `documents`.
create or replace function public.moxt_purgeable_documents()
returns table (storage_path text, source text)
language sql
security definer
set search_path = public
as $$
  select d.storage_path, 'personal'::text
  from public.personal_documents d
  where d.storage_path is not null
    and d.legal_hold_until is not null
    and d.legal_hold_until < now()
  union all
  select b.storage_path, 'business'::text
  from public.business_documents b
  where b.storage_path is not null
    and b.legal_hold_until is not null
    and b.legal_hold_until < now();
$$;

revoke all on function public.moxt_purgeable_documents() from public;
grant execute on function public.moxt_purgeable_documents() to authenticated;

-- ── 3. Fichiers orphelins ──────────────────────────────────────────────────
-- Un upload réussi suivi d'un enregistrement en base échoué (onglet fermé,
-- réseau coupé) laisse un fichier que l'app ne référence plus : jamais purgé,
-- non supprimé à la clôture du compte. Ces fichiers ne sont couverts par
-- aucune obligation légale — ils n'appartiennent à aucun dossier client.
-- Délai de grâce de 24 h pour ne jamais toucher un upload en cours.
create or replace function public.moxt_orphan_document_objects(p_grace_hours int default 24)
returns table (object_name text, uploaded_at timestamptz)
language sql
security definer
set search_path = public, storage
as $$
  select o.name, o.created_at
  from storage.objects o
  where o.bucket_id = 'documents'
    and o.created_at < now() - make_interval(hours => p_grace_hours)
    and not exists (
      select 1 from public.personal_documents d where d.storage_path = o.name
    )
    and not exists (
      select 1 from public.business_documents b where b.storage_path = o.name
    );
$$;

revoke all on function public.moxt_orphan_document_objects(int) from public;
grant execute on function public.moxt_orphan_document_objects(int) to authenticated;

-- Supprime réellement les objets orphelins. Réservé aux admins.
create or replace function public.moxt_purge_orphan_documents(p_grace_hours int default 24)
returns int
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_deleted int;
begin
  if not public.moxt_is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  with orphans as (
    select object_name from public.moxt_orphan_document_objects(p_grace_hours)
  )
  delete from storage.objects o
  using orphans
  where o.bucket_id = 'documents' and o.name = orphans.object_name;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.moxt_purge_orphan_documents(int) from public;
grant execute on function public.moxt_purge_orphan_documents(int) to authenticated;

notify pgrst, 'reload schema';
