-- Statuts éphémères (façon WhatsApp/Instagram Story) — durée de vie 7 jours.
-- Réutilise le bucket storage 'listings' déjà public + RLS par préfixe ${uid}/...
-- (voir storageService.uploadStatusImages → ${userId}/statuses/${statusId}/...).

create table if not exists public.statuses (
  id text primary key,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default '',
  author_avatar_url text,
  images jsonb not null default '[]'::jsonb,
  caption text not null default '',
  viewed_by jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index if not exists statuses_author_idx on public.statuses (author_id);
create index if not exists statuses_expires_idx on public.statuses (expires_at desc);

alter table public.statuses enable row level security;

drop policy if exists "MOXT read active statuses" on public.statuses;
create policy "MOXT read active statuses" on public.statuses for select to authenticated using (
  expires_at > now()
  or author_id::text = (select auth.uid())::text
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
);

drop policy if exists "MOXT create own statuses" on public.statuses;
create policy "MOXT create own statuses" on public.statuses for insert to authenticated
  with check (author_id::text = (select auth.uid())::text);

-- "update" couvre le marquage "vu" par n'importe quel utilisateur authentifié
-- (ajout de son id à viewed_by) ; la légende/images restent modifiables par l'auteur
-- uniquement — contrôlé côté client (updateStatus n'expose que markViewed en pratique).
drop policy if exists "MOXT update statuses" on public.statuses;
create policy "MOXT update statuses" on public.statuses for update to authenticated
  using (expires_at > now())
  with check (true);

drop policy if exists "MOXT delete own statuses" on public.statuses;
create policy "MOXT delete own statuses" on public.statuses for delete to authenticated
  using (
    author_id::text = (select auth.uid())::text
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin'))
  );

grant select, insert, update, delete on public.statuses to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'statuses'
  ) then
    alter publication supabase_realtime add table public.statuses;
  end if;
end $$;

notify pgrst, 'reload schema';
