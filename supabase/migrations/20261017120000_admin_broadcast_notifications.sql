-- Centre de notifications administrateur : diffusions ciblées et personnalisées.
-- Permet aux administrateurs de diffuser des notifications à tous les utilisateurs
-- ou à un sous-ensemble ciblé (rôle, pays, vérifiés, sélection manuelle),
-- avec badge personnalisable (texte, couleur, icône) et affichage en tiroir bas (bottom sheet).

-- 1. Extension de la table `notifications`
alter table public.notifications
  add column if not exists badge_text text,
  add column if not exists badge_color text,
  add column if not exists badge_icon text,
  add column if not exists display_mode text not null default 'standard',
  add column if not exists action_label text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

-- 2. Table d'historique des diffusions administrateur
create table if not exists public.admin_broadcasts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  message text not null,
  target_type text not null default 'all' check (target_type in ('all', 'role', 'country', 'verified', 'custom')),
  target_filter jsonb not null default '{}'::jsonb,
  badge_text text,
  badge_color text,
  badge_icon text,
  display_mode text not null default 'standard' check (display_mode in ('standard', 'sheet')),
  action_label text,
  link text,
  priority text not null default 'normal' check (priority in ('high', 'normal', 'low')),
  recipient_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists admin_broadcasts_created_at_idx
  on public.admin_broadcasts (created_at desc);

alter table public.admin_broadcasts enable row level security;

drop policy if exists admin_broadcasts_admin_read on public.admin_broadcasts;
create policy admin_broadcasts_admin_read on public.admin_broadcasts
  for select to authenticated
  using (public.moxt_is_admin());

drop policy if exists admin_broadcasts_admin_all on public.admin_broadcasts;
create policy admin_broadcasts_admin_all on public.admin_broadcasts
  for all to authenticated
  using (public.moxt_is_admin())
  with check (public.moxt_is_admin());

-- 3. RPC d'envoi d'une diffusion administrateur
create or replace function public.moxt_admin_broadcast_notification(
  p_title text,
  p_message text,
  p_target_type text default 'all',
  p_target_filter jsonb default '{}'::jsonb,
  p_badge_text text default null,
  p_badge_color text default null,
  p_badge_icon text default null,
  p_display_mode text default 'standard',
  p_action_label text default null,
  p_link text default null,
  p_priority text default 'normal'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := auth.uid();
  v_broadcast_id uuid;
  v_title text := left(trim(coalesce(p_title, '')), 200);
  v_message text := left(trim(coalesce(p_message, '')), 2000);
  v_target_type text := coalesce(nullif(trim(p_target_type), ''), 'all');
  v_display_mode text := case when p_display_mode = 'sheet' then 'sheet' else 'standard' end;
  v_priority text := case when p_priority in ('high', 'normal', 'low') then p_priority else 'normal' end;
  v_link text := nullif(trim(coalesce(p_link, '')), '');
  v_badge_text text := nullif(trim(coalesce(p_badge_text, '')), '');
  v_badge_color text := nullif(trim(coalesce(p_badge_color, '')), '');
  v_badge_icon text := nullif(trim(coalesce(p_badge_icon, '')), '');
  v_action_label text := nullif(trim(coalesce(p_action_label, '')), '');
  v_target_role text := nullif(trim(coalesce(p_target_filter->>'role', '')), '');
  v_target_country text := upper(nullif(trim(coalesce(p_target_filter->>'country', '')), ''));
  v_custom_user_ids text[];
  v_count integer := 0;
begin
  if not public.moxt_is_admin() then
    raise exception 'Accès réservé aux administrateurs.';
  end if;

  if v_title = '' then
    raise exception 'Le titre de la notification est requis.';
  end if;

  if v_message = '' then
    raise exception 'Le message de la notification est requis.';
  end if;

  -- Validation du lien relatif
  if v_link is not null then
    if v_link ~* '^https?://[^/]+(/.*)$' then
      v_link := substring(v_link from '^https?://[^/]+(/.*)$');
    end if;
    if left(v_link, 1) <> '/' or left(v_link, 2) = '//' or v_link ~* '^(javascript:|data:)' then
      v_link := null;
    end if;
  end if;

  -- Extraction des userIds personnalisés
  if v_target_type = 'custom' and p_target_filter ? 'userIds' then
    select coalesce(array_agg(elem::text), array[]::text[])
    into v_custom_user_ids
    from jsonb_array_elements_text(p_target_filter->'userIds') as elem;
  end if;

  -- 1. Enregistrement de la diffusion dans l'historique
  insert into public.admin_broadcasts (
    created_by,
    title,
    message,
    target_type,
    target_filter,
    badge_text,
    badge_color,
    badge_icon,
    display_mode,
    action_label,
    link,
    priority,
    recipient_count
  ) values (
    v_admin,
    v_title,
    v_message,
    v_target_type,
    coalesce(p_target_filter, '{}'::jsonb),
    v_badge_text,
    v_badge_color,
    v_badge_icon,
    v_display_mode,
    v_action_label,
    v_link,
    v_priority,
    0
  )
  returning id into v_broadcast_id;

  -- 2. Insertion en masse dans notifications pour chaque destinataire ciblé
  perform set_config('moxt.skip_push', '1', true);

  insert into public.notifications (
    id,
    user_id,
    title,
    message,
    type,
    link,
    priority,
    badge_text,
    badge_color,
    badge_icon,
    display_mode,
    action_label,
    metadata,
    read,
    archived,
    created_at,
    updated_at
  )
  select
    'NOT-BCAST-' || left(replace(v_broadcast_id::text, '-', ''), 14) || '-' || left(replace(p.id::text, '-', ''), 12),
    p.id,
    v_title,
    v_message,
    'broadcast',
    v_link,
    v_priority,
    v_badge_text,
    v_badge_color,
    v_badge_icon,
    v_display_mode,
    v_action_label,
    jsonb_build_object(
      'broadcastId', v_broadcast_id,
      'displayMode', v_display_mode,
      'badgeText', v_badge_text,
      'badgeColor', v_badge_color,
      'badgeIcon', v_badge_icon,
      'actionLabel', v_action_label
    ),
    false,
    false,
    now(),
    now()
  from public.profiles p
  where coalesce(p.status, 'active') not in ('suspended', 'banned', 'blocked', 'disabled', 'pending_deletion')
    and (
      v_target_type = 'all'
      or (v_target_type = 'role' and p.role = v_target_role)
      or (v_target_type = 'country' and (upper(coalesce(p.country, '')) = v_target_country or upper(coalesce(p.origin_country, '')) = v_target_country))
      or (v_target_type = 'verified' and (coalesce(p.phone_verified, false) = true or p.status = 'verified' or coalesce(p.email_verified, false) = true))
      or (v_target_type = 'custom' and p.id::text = any(v_custom_user_ids))
    )
  on conflict (id) do update set
    title = excluded.title,
    message = excluded.message,
    link = excluded.link,
    priority = excluded.priority,
    badge_text = excluded.badge_text,
    badge_color = excluded.badge_color,
    badge_icon = excluded.badge_icon,
    display_mode = excluded.display_mode,
    action_label = excluded.action_label,
    metadata = excluded.metadata,
    read = false,
    archived = false,
    updated_at = now();

  get diagnostics v_count = row_count;

  -- 3. Mise à jour du compteur de destinataires dans l'historique
  update public.admin_broadcasts
  set recipient_count = v_count
  where id = v_broadcast_id;

  return jsonb_build_object(
    'success', true,
    'broadcastId', v_broadcast_id,
    'recipientCount', v_count
  );
end;
$$;

revoke all on function public.moxt_admin_broadcast_notification(text, text, text, jsonb, text, text, text, text, text, text, text) from public;
grant execute on function public.moxt_admin_broadcast_notification(text, text, text, jsonb, text, text, text, text, text, text, text) to authenticated;

-- 4. RPC de récupération de l'historique des diffusions
create or replace function public.moxt_admin_list_broadcasts(p_limit int default 50)
returns table (
  id uuid,
  created_by uuid,
  title text,
  message text,
  target_type text,
  target_filter jsonb,
  badge_text text,
  badge_color text,
  badge_icon text,
  display_mode text,
  action_label text,
  link text,
  priority text,
  recipient_count integer,
  read_count bigint,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.moxt_is_admin() then
    raise exception 'Accès réservé aux administrateurs.';
  end if;

  return query
  select
    b.id,
    b.created_by,
    b.title,
    b.message,
    b.target_type,
    b.target_filter,
    b.badge_text,
    b.badge_color,
    b.badge_icon,
    b.display_mode,
    b.action_label,
    b.link,
    b.priority,
    b.recipient_count,
    coalesce(
      (
        select count(*)
        from public.notifications n
        where (n.metadata->>'broadcastId') = b.id::text
          and n.read = true
      ),
      0
    )::bigint as read_count,
    b.created_at
  from public.admin_broadcasts b
  order by b.created_at desc
  limit p_limit;
end;
$$;

revoke all on function public.moxt_admin_list_broadcasts(int) from public;
grant execute on function public.moxt_admin_list_broadcasts(int) to authenticated;

notify pgrst, 'reload schema';
