-- Rôle modérateur : staff contenu (catalogues, posts, signalements, avis, litiges)
-- Sans accès users / finance / KYC / documents (reste sur moxt_is_admin)

create or replace function public.moxt_is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('moderator', 'admin', 'superadmin')
  );
$$;

revoke all on function public.moxt_is_moderator() from public;
grant execute on function public.moxt_is_moderator() to authenticated, anon, service_role;

-- ---------------------------------------------------------------------------
-- Businesses
-- ---------------------------------------------------------------------------

drop policy if exists "MOXT users can view validated businesses" on public.businesses;
create policy "MOXT users can view validated businesses"
on public.businesses
for select
to authenticated
using (
  status in ('verified', 'approved', 'active')
  or owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT users can update own business" on public.businesses;
create policy "MOXT users can update own business"
on public.businesses
for update
to authenticated
using (
  owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
)
with check (
  owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------

drop policy if exists "MOXT authenticated users can view listings" on public.listings;
create policy "MOXT authenticated users can view listings"
on public.listings
for select
to authenticated
using (
  status = 'active'
  or owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT users can update own listings" on public.listings;
create policy "MOXT users can update own listings"
on public.listings
for update
to authenticated
using (
  owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
)
with check (
  owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT users can delete own listings" on public.listings;
create policy "MOXT users can delete own listings"
on public.listings
for delete
to authenticated
using (
  owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

-- ---------------------------------------------------------------------------
-- Listing questions
-- ---------------------------------------------------------------------------

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
        or public.moxt_is_moderator()
      )
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
        or public.moxt_is_moderator()
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
        or public.moxt_is_moderator()
      )
  )
);

-- ---------------------------------------------------------------------------
-- Parcels / jobs / events / posts
-- ---------------------------------------------------------------------------

drop policy if exists "MOXT read parcels" on public.parcels;
create policy "MOXT read parcels" on public.parcels for select to authenticated using (
  status in ('active', 'full')
  or owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT update own parcels" on public.parcels;
create policy "MOXT update own parcels" on public.parcels for update to authenticated
  using (owner_id::text = (select auth.uid())::text or public.moxt_is_moderator());

drop policy if exists "MOXT read parcel requests" on public.parcel_requests;
create policy "MOXT read parcel requests" on public.parcel_requests for select to authenticated using (
  user_id::text = (select auth.uid())::text
  or owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT update parcel requests" on public.parcel_requests;
create policy "MOXT update parcel requests" on public.parcel_requests for update to authenticated using (
  user_id::text = (select auth.uid())::text
  or owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT read jobs" on public.jobs;
create policy "MOXT read jobs" on public.jobs for select to authenticated using (
  status = 'active'
  or owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT manage own jobs" on public.jobs;
create policy "MOXT manage own jobs" on public.jobs for all to authenticated
  using (owner_id::text = (select auth.uid())::text or public.moxt_is_moderator())
  with check (owner_id::text = (select auth.uid())::text);

drop policy if exists "MOXT read job applications" on public.job_applications;
create policy "MOXT read job applications" on public.job_applications for select to authenticated using (
  user_id::text = (select auth.uid())::text
  or exists (select 1 from public.jobs j where j.id = job_id and j.owner_id::text = (select auth.uid())::text)
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT update job applications" on public.job_applications;
create policy "MOXT update job applications" on public.job_applications for update to authenticated using (
  user_id::text = (select auth.uid())::text
  or exists (select 1 from public.jobs j where j.id = job_id and j.owner_id::text = (select auth.uid())::text)
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT read events" on public.events;
create policy "MOXT read events" on public.events for select to authenticated using (
  status = 'published'
  or owner_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT manage own events" on public.events;
create policy "MOXT manage own events" on public.events for all to authenticated
  using (owner_id::text = (select auth.uid())::text or public.moxt_is_moderator())
  with check (owner_id::text = (select auth.uid())::text);

drop policy if exists "MOXT read event registrations" on public.event_registrations;
create policy "MOXT read event registrations" on public.event_registrations for select to authenticated using (
  user_id::text = (select auth.uid())::text
  or exists (select 1 from public.events e where e.id = event_id and e.owner_id::text = (select auth.uid())::text)
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT read posts" on public.posts;
create policy "MOXT read posts" on public.posts for select to authenticated using (
  status = 'published'
  or author_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT update own posts" on public.posts;
create policy "MOXT update own posts"
  on public.posts
  for update
  to authenticated
  using (
    author_id::text = (select auth.uid())::text
    or public.moxt_is_moderator()
  )
  with check (
    author_id::text = (select auth.uid())::text
    or public.moxt_is_moderator()
  );

drop policy if exists "MOXT delete own posts" on public.posts;
create policy "MOXT delete own posts"
  on public.posts
  for delete
  to authenticated
  using (
    author_id::text = (select auth.uid())::text
    or public.moxt_is_moderator()
  );

-- Comment delete RPC: allow moderators
create or replace function public.moxt_post_delete_comment(p_post_id text, p_comment_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post public.posts%rowtype;
  v_comment jsonb;
  v_comment_author text;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  select *
  into v_post
  from public.posts
  where id = p_post_id
  for update;

  if not found then
    raise exception 'Publication introuvable';
  end if;

  select elem
  into v_comment
  from jsonb_array_elements(coalesce(v_post.comments, '[]'::jsonb)) elem
  where elem->>'id' = p_comment_id
  limit 1;

  if v_comment is null then
    return;
  end if;

  v_comment_author := coalesce(v_comment->>'authorId', v_comment->>'author_id');

  if v_comment_author <> auth.uid()::text
    and v_post.author_id::text <> auth.uid()::text
    and not public.moxt_is_moderator() then
    raise exception 'Suppression non autorisée';
  end if;

  update public.posts
  set
    comments = coalesce(
      (
        select jsonb_agg(elem)
        from jsonb_array_elements(coalesce(v_post.comments, '[]'::jsonb)) elem
        where elem->>'id' <> p_comment_id
      ),
      '[]'::jsonb
    ),
    updated_at = now()
  where id = p_post_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------

drop policy if exists "MOXT read listing reports" on public.listing_reports;
create policy "MOXT read listing reports" on public.listing_reports for select to authenticated using (
  reporter_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT update listing reports" on public.listing_reports;
create policy "MOXT update listing reports" on public.listing_reports for update to authenticated using (
  public.moxt_is_moderator()
);

drop policy if exists "MOXT read job reports" on public.job_reports;
create policy "MOXT read job reports" on public.job_reports for select to authenticated using (
  reporter_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT update job reports" on public.job_reports;
create policy "MOXT update job reports" on public.job_reports for update to authenticated using (
  public.moxt_is_moderator()
);

drop policy if exists "MOXT read event reports" on public.event_reports;
create policy "MOXT read event reports" on public.event_reports for select to authenticated using (
  reporter_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT update event reports" on public.event_reports;
create policy "MOXT update event reports" on public.event_reports for update to authenticated using (
  public.moxt_is_moderator()
);

drop policy if exists "MOXT subscriber reports read" on public.subscriber_reports;
create policy "MOXT subscriber reports read"
  on public.subscriber_reports
  for select
  to authenticated
  using (
    reporter_id::text = auth.uid()::text
    or (
      (publisher_type = 'user' and publisher_id = auth.uid()::text)
      or (publisher_type = 'business' and public.moxt_owns_business(publisher_id))
    )
    or public.moxt_is_moderator()
  );

drop policy if exists "MOXT subscriber reports admin update" on public.subscriber_reports;
create policy "MOXT subscriber reports admin update"
  on public.subscriber_reports
  for update
  to authenticated
  using (public.moxt_is_moderator());

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------

drop policy if exists "MOXT update reviews" on public.reviews;
create policy "MOXT update reviews" on public.reviews for update to authenticated using (
  author_id::text = (select auth.uid())::text
  or public.moxt_owns_review_target(target_type, target_id)
  or public.moxt_is_moderator()
);

-- ---------------------------------------------------------------------------
-- Disputes (trust & safety) — keep transfers/P2P admin-only elsewhere
-- ---------------------------------------------------------------------------

drop policy if exists "MOXT read disputes" on public.disputes;
create policy "MOXT read disputes" on public.disputes for select to authenticated using (
  reporter_id::text = (select auth.uid())::text
  or target_id::text = (select auth.uid())::text
  or public.moxt_is_moderator()
);

drop policy if exists "MOXT admin update disputes" on public.disputes;
create policy "MOXT admin update disputes"
  on public.disputes
  for update
  to authenticated
  using (public.moxt_is_moderator())
  with check (public.moxt_is_moderator());

create or replace function private.moxt_disputes_update_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and not public.moxt_is_moderator() then
    if old.reporter_id is distinct from auth.uid() then
      raise exception 'MOXT_DISPUTE_UPDATE_DENIED';
    end if;
    new.status := old.status;
    new.updated_by := old.updated_by;
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
