-- When a published catalog item leaves a live status (or is deleted),
-- archive feed posts that reshare it via source_type + source_id.
-- SECURITY DEFINER: owners / admins must be able to archive third-party reshares.

create index if not exists posts_source_type_id_idx
  on public.posts (source_type, source_id)
  where source_id is not null;

create or replace function public.moxt_archive_linked_posts(
  p_source_type text,
  p_source_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_source_type is null or p_source_id is null or btrim(p_source_id) = '' then
    return;
  end if;

  update public.posts
  set
    status = 'archived',
    updated_at = now()
  where source_type = p_source_type
    and source_id = p_source_id
    and status is distinct from 'archived';
end;
$$;

revoke all on function public.moxt_archive_linked_posts(text, text) from public;
grant execute on function public.moxt_archive_linked_posts(text, text) to authenticated;
grant execute on function public.moxt_archive_linked_posts(text, text) to service_role;

create or replace function public.moxt_cascade_archive_posts_from_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.moxt_archive_linked_posts('listing', old.id);
    return old;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  -- Live public status for listings is only 'active'
  if new.status is distinct from 'active' then
    perform public.moxt_archive_linked_posts('listing', new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists listings_cascade_archive_posts on public.listings;
create trigger listings_cascade_archive_posts
  after update of status or delete on public.listings
  for each row
  execute function public.moxt_cascade_archive_posts_from_listing();

create or replace function public.moxt_cascade_archive_posts_from_parcel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.moxt_archive_linked_posts('parcel', old.id);
    return old;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  -- Live parcel statuses (RLS): active, full
  if new.status not in ('active', 'full') then
    perform public.moxt_archive_linked_posts('parcel', new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists parcels_cascade_archive_posts on public.parcels;
create trigger parcels_cascade_archive_posts
  after update of status or delete on public.parcels
  for each row
  execute function public.moxt_cascade_archive_posts_from_parcel();

create or replace function public.moxt_cascade_archive_posts_from_job()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.moxt_archive_linked_posts('job', old.id);
    return old;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status is distinct from 'active' then
    perform public.moxt_archive_linked_posts('job', new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists jobs_cascade_archive_posts on public.jobs;
create trigger jobs_cascade_archive_posts
  after update of status or delete on public.jobs
  for each row
  execute function public.moxt_cascade_archive_posts_from_job();

create or replace function public.moxt_cascade_archive_posts_from_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.moxt_archive_linked_posts('event', old.id);
    return old;
  end if;

  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status is distinct from 'published' then
    perform public.moxt_archive_linked_posts('event', new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists events_cascade_archive_posts on public.events;
create trigger events_cascade_archive_posts
  after update of status or delete on public.events
  for each row
  execute function public.moxt_cascade_archive_posts_from_event();

create or replace function public.moxt_cascade_archive_posts_from_business()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_deleted text;
  new_deleted text;
  was_soft_deleted boolean := false;
  left_live_status boolean := false;
begin
  if tg_op = 'DELETE' then
    perform public.moxt_archive_linked_posts('business', old.id);
    return old;
  end if;

  old_deleted := old.payload ->> 'deletedByUserAt';
  new_deleted := new.payload ->> 'deletedByUserAt';
  was_soft_deleted :=
    (coalesce(new_deleted, '') <> '')
    and coalesce(old_deleted, '') is distinct from coalesce(new_deleted, '');

  left_live_status :=
    new.status is distinct from old.status
    and new.status not in ('verified', 'approved', 'active');

  if was_soft_deleted or left_live_status then
    perform public.moxt_archive_linked_posts('business', new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists businesses_cascade_archive_posts on public.businesses;
create trigger businesses_cascade_archive_posts
  after update of status, payload or delete on public.businesses
  for each row
  execute function public.moxt_cascade_archive_posts_from_business();

notify pgrst, 'reload schema';
