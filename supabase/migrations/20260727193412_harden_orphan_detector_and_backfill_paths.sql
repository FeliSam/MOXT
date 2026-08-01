-- Backfill des chemins de stockage manquants (idempotent).
update public.business_documents
set storage_path = substring(url from '(?:/object/(?:sign|authenticated|public)/documents/)([^?]+)')
where storage_path is null
  and url is not null
  and url ~ '/object/(sign|authenticated|public)/documents/';

update public.personal_documents
set storage_path = substring(url from '(?:/object/(?:sign|authenticated|public)/documents/)([^?]+)')
where storage_path is null
  and url is not null
  and url ~ '/object/(sign|authenticated|public)/documents/';

-- Détecteur d'orphelins durci : un fichier n'est orphelin que si AUCUNE ligne
-- ne le référence, ni par storage_path NI par url. La version précédente ne
-- regardait que storage_path et signalait à tort des documents KYC validés
-- dont seule l'url était renseignée — les supprimer aurait détruit des pièces
-- soumises à la rétention légale 115-ФЗ.
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
      select 1 from public.personal_documents d
      where d.storage_path = o.name
         or (d.url is not null and position(o.name in d.url) > 0)
    )
    and not exists (
      select 1 from public.business_documents b
      where b.storage_path = o.name
         or (b.url is not null and position(o.name in b.url) > 0)
    );
$$;

revoke all on function public.moxt_orphan_document_objects(int) from public;
grant execute on function public.moxt_orphan_document_objects(int) to authenticated;

notify pgrst, 'reload schema';
