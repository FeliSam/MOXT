create table if not exists public.listing_questions (
  id text primary key,
  listing_id text not null references public.listings(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '',
  text text not null,
  answer text not null default '',
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists listing_questions_listing_id_idx
on public.listing_questions (listing_id, created_at desc);

alter table public.listing_questions enable row level security;

drop policy if exists "MOXT users can view listing questions" on public.listing_questions;
create policy "MOXT users can view listing questions"
on public.listing_questions
for select
to authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_questions.listing_id
      and (
        l.status = 'active'
        or l.owner_id::text = (select auth.uid())::text
        or listing_questions.author_id::text = (select auth.uid())::text
        or exists (
          select 1
          from public.profiles p
          where p.id = (select auth.uid())
            and p.role in ('admin', 'superadmin')
        )
      )
  )
);

drop policy if exists "MOXT users can ask on active listings" on public.listing_questions;
create policy "MOXT users can ask on active listings"
on public.listing_questions
for insert
to authenticated
with check (
  author_id::text = (select auth.uid())::text
  and exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.status = 'active'
      and l.owner_id::text <> (select auth.uid())::text
  )
);

drop policy if exists "MOXT listing owners can answer questions" on public.listing_questions;
create policy "MOXT listing owners can answer questions"
on public.listing_questions
for update
to authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_questions.listing_id
      and (
        l.owner_id::text = (select auth.uid())::text
        or exists (
          select 1
          from public.profiles p
          where p.id = (select auth.uid())
            and p.role in ('admin', 'superadmin')
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.listings l
    where l.id = listing_questions.listing_id
      and (
        l.owner_id::text = (select auth.uid())::text
        or exists (
          select 1
          from public.profiles p
          where p.id = (select auth.uid())
            and p.role in ('admin', 'superadmin')
        )
      )
  )
);

grant select, insert, update on table public.listing_questions to authenticated;

notify pgrst, 'reload schema';
