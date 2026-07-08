-- Avis : réponses propriétaire, contestation, anti-doublon

alter table public.reviews add column if not exists reply_text text;
alter table public.reviews add column if not exists reply_at timestamptz;
alter table public.reviews add column if not exists reply_by uuid references auth.users (id);
alter table public.reviews add column if not exists dispute_status text not null default 'none';
alter table public.reviews add column if not exists dispute_reason text not null default '';
alter table public.reviews add column if not exists disputed_at timestamptz;
alter table public.reviews add column if not exists updated_at timestamptz not null default now();

create unique index if not exists reviews_author_target_uidx
  on public.reviews (author_id, target_type, target_id);

create or replace function public.moxt_owns_review_target(tt text, tid text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when tt = 'user_profile' then tid = (select auth.uid())::text
    when tt = 'business' then public.moxt_owns_business(tid)
    when tt = 'listing' then exists (
      select 1 from public.listings l
      where l.id = tid and l.owner_id::text = (select auth.uid())::text
    )
    when tt = 'parcel' then exists (
      select 1 from public.parcels p
      where p.id = tid and p.owner_id::text = (select auth.uid())::text
    )
    when tt = 'job' then exists (
      select 1 from public.jobs j
      where j.id = tid and j.owner_id::text = (select auth.uid())::text
    )
    when tt = 'event' then exists (
      select 1 from public.events e
      where e.id = tid and e.owner_id::text = (select auth.uid())::text
    )
    when tt = 'post' then exists (
      select 1 from public.posts po
      where po.id = tid and po.author_id::text = (select auth.uid())::text
    )
    else false
  end;
$$;

drop policy if exists "MOXT update reviews" on public.reviews;
create policy "MOXT update reviews" on public.reviews for update to authenticated using (
  author_id::text = (select auth.uid())::text
  or public.moxt_owns_review_target(target_type, target_id)
  or exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('admin', 'superadmin')
  )
);

notify pgrst, 'reload schema';
