-- Abonnements éditeur (utilisateur ou entreprise) + préférences de notification

create table if not exists public.publisher_subscriptions (
  id text primary key,
  subscriber_id uuid not null references auth.users (id) on delete cascade,
  publisher_type text not null check (publisher_type in ('user', 'business')),
  publisher_id text not null,
  notify_pref text not null default 'all' check (notify_pref in ('all', 'important', 'muted')),
  publisher_name text not null default '',
  publisher_path text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscriber_id, publisher_type, publisher_id)
);

create index if not exists publisher_subscriptions_subscriber_idx
  on public.publisher_subscriptions (subscriber_id, updated_at desc);

create index if not exists publisher_subscriptions_publisher_idx
  on public.publisher_subscriptions (publisher_type, publisher_id, updated_at desc);

alter table public.publisher_subscriptions enable row level security;

drop policy if exists "MOXT publisher subscriptions subscriber manage" on public.publisher_subscriptions;
create policy "MOXT publisher subscriptions subscriber manage"
  on public.publisher_subscriptions
  for all
  to authenticated
  using (subscriber_id::text = auth.uid()::text)
  with check (subscriber_id::text = auth.uid()::text);

drop policy if exists "MOXT publisher subscriptions publisher read" on public.publisher_subscriptions;
create policy "MOXT publisher subscriptions publisher read"
  on public.publisher_subscriptions
  for select
  to authenticated
  using (
    (publisher_type = 'user' and publisher_id = auth.uid()::text)
    or (
      publisher_type = 'business'
      and exists (
        select 1
        from public.businesses b
        where b.id = publisher_id
          and b.owner_id::text = auth.uid()::text
      )
    )
  );

grant select, insert, update, delete on public.publisher_subscriptions to authenticated;

notify pgrst, 'reload schema';
