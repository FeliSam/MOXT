-- moxt_create_notification() exige auth.uid() ; pg_cron s'exécute sans
-- contexte d'authentification, le job échouait donc silencieusement.
-- On insère directement (fonction security definer, non exposée au public).
create or replace function public.moxt_report_document_hygiene()
returns int
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_orphans int;
  v_expired int;
  admin_record record;
  v_notified int := 0;
  v_day text := to_char(now(), 'YYYY-MM-DD');
begin
  select count(*) into v_orphans from public.moxt_orphan_document_objects(24);
  select count(*) into v_expired from public.moxt_purgeable_documents();

  if v_orphans = 0 and v_expired = 0 then
    return 0;
  end if;

  for admin_record in
    select id from public.profiles where role in ('admin', 'superadmin')
  loop
    insert into public.notifications (
      id, user_id, title, message, type, link, priority,
      read, archived, created_at, updated_at
    ) values (
      'NOT-DOCHYG-' || v_day || '-' || left(replace(admin_record.id::text, '-', ''), 12),
      admin_record.id,
      'Maintenance stockage documents',
      v_orphans || ' fichier(s) orphelin(s), ' || v_expired || ' document(s) hors retention legale.',
      'moderation',
      '/admin?view=documents',
      'normal',
      false, false, now(), now()
    )
    on conflict (id) do update set
      message = excluded.message,
      read = false,
      archived = false,
      updated_at = now();
    v_notified := v_notified + 1;
  end loop;

  return v_notified;
end;
$$;

revoke all on function public.moxt_report_document_hygiene() from public;

notify pgrst, 'reload schema';
