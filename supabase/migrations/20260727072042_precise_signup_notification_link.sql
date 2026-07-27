-- Le lien de la notification "nouveau compte créé" pointait vers la liste
-- admin générale (/admin?view=users) au lieu du profil précis du nouvel
-- utilisateur. On pointe désormais vers sa page publique de publications,
-- qui existe déjà et est visible par les admins quel que soit le statut.

create or replace function public.moxt_notify_admins_new_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_record record;
  member_name text;
  notif_id text;
begin
  if new.role in ('admin', 'superadmin', 'moderator') then
    return new;
  end if;

  member_name := nullif(trim(concat(coalesce(new.first_name, ''), ' ', coalesce(new.last_name, ''))), '');
  if member_name is null then
    member_name := coalesce(nullif(trim(new.email), ''), 'Un membre');
  end if;

  notif_id := 'NOT-SIGNUP-' || left(replace(new.id::text, '-', ''), 16);

  for admin_record in
    select id
    from public.profiles
    where role in ('admin', 'superadmin')
      and id is distinct from new.id
  loop
    insert into public.notifications (
      id,
      user_id,
      title,
      message,
      type,
      link,
      priority,
      read,
      archived,
      created_at,
      updated_at
    ) values (
      notif_id || '-' || left(replace(admin_record.id::text, '-', ''), 12),
      admin_record.id,
      'Nouveau compte créé',
      member_name || ' vient de créer un compte MOXT.',
      'moderation',
      '/users/' || new.id::text || '/publications',
      'normal',
      false,
      false,
      now(),
      now()
    )
    on conflict (id) do update
      set
        title = excluded.title,
        message = excluded.message,
        link = excluded.link,
        priority = excluded.priority,
        read = false,
        archived = false,
        updated_at = now();
  end loop;

  return new;
end;
$$;
