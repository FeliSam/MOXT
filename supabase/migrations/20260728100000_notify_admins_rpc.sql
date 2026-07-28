-- Notifications admin déclenchées par un utilisateur NON-admin.
--
-- Cause du bug : `notifyAdmins()` (client) itère sur `state.administration.users`,
-- qui n'est chargé que `if (isAdmin)` dans loadAllData. Quand une entreprise
-- envoie un document, la liste est vide chez elle → aucune notification n'est
-- créée. Le même défaut touchait aussi : contestation d'avis, signalement
-- d'abonné, signalement de contenu, ouverture de litige, ticket support.
--
-- Correctif : la résolution des admins passe côté serveur (security definer),
-- le client n'a plus besoin de connaître la liste.

create or replace function public.moxt_notify_admins(
  p_title text,
  p_message text,
  p_type text default 'moderation',
  p_link text default '/admin',
  p_priority text default 'high',
  p_dedupe_key text default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_record record;
  v_actor uuid := (select auth.uid());
  v_key text := coalesce(nullif(p_dedupe_key, ''), replace(gen_random_uuid()::text, '-', ''));
  v_count int := 0;
begin
  if v_actor is null then
    raise exception 'Authentification requise.';
  end if;

  for admin_record in
    select id from public.profiles
    where role in ('admin', 'superadmin')
      and id is distinct from v_actor
  loop
    insert into public.notifications (
      id, user_id, title, message, type, link, priority,
      read, archived, created_at, updated_at
    ) values (
      'NOT-ADM-' || left(v_key, 20) || '-' || left(replace(admin_record.id::text, '-', ''), 12),
      admin_record.id,
      p_title,
      p_message,
      coalesce(p_type, 'moderation'),
      coalesce(p_link, '/admin'),
      coalesce(p_priority, 'high'),
      false, false, now(), now()
    )
    on conflict (id) do update set
      title = excluded.title,
      message = excluded.message,
      link = excluded.link,
      priority = excluded.priority,
      read = false,
      archived = false,
      updated_at = now();
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.moxt_notify_admins(text, text, text, text, text, text) from public;
grant execute on function public.moxt_notify_admins(text, text, text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
