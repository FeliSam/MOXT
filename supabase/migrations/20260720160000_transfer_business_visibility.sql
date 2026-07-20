-- Make transfers visible to the business that owns business_id,
-- backfill missing business_owner_id, and require owner on insert.

-- 1) Repair existing rows where owner was never stored
update public.transfers t
set business_owner_id = b.owner_id,
    updated_at = now()
from public.businesses b
where b.id = t.business_id
  and t.business_owner_id is null
  and b.owner_id is not null;

-- 2) SELECT: sender, stored owner, OR current owner of the business
drop policy if exists "MOXT read transfers" on public.transfers;
create policy "MOXT read transfers" on public.transfers
  for select to authenticated
  using (
    user_id::text = (select auth.uid())::text
    or business_owner_id::text = (select auth.uid())::text
    or exists (
      select 1
      from public.businesses b
      where b.id = transfers.business_id
        and b.owner_id::text = (select auth.uid())::text
    )
    or exists (
      select 1
      from public.profiles p
      where p.id::text = (select auth.uid())::text
        and p.role in ('admin', 'superadmin', 'moderator')
    )
  );

-- 3) UPDATE: same visibility parties
drop policy if exists "MOXT update transfers" on public.transfers;
create policy "MOXT update transfers" on public.transfers
  for update to authenticated
  using (
    user_id::text = (select auth.uid())::text
    or business_owner_id::text = (select auth.uid())::text
    or exists (
      select 1
      from public.businesses b
      where b.id = transfers.business_id
        and b.owner_id::text = (select auth.uid())::text
    )
    or exists (
      select 1
      from public.profiles p
      where p.id::text = (select auth.uid())::text
        and p.role in ('admin', 'superadmin', 'moderator')
    )
  )
  with check (
    user_id::text = (select auth.uid())::text
    or business_owner_id::text = (select auth.uid())::text
    or exists (
      select 1
      from public.businesses b
      where b.id = transfers.business_id
        and b.owner_id::text = (select auth.uid())::text
    )
    or exists (
      select 1
      from public.profiles p
      where p.id::text = (select auth.uid())::text
        and p.role in ('admin', 'superadmin', 'moderator')
    )
  );

-- 4) INSERT: require a partner business owner (no null loophole)
drop policy if exists "MOXT insert transfers" on public.transfers;
create policy "MOXT insert transfers" on public.transfers
  for insert to authenticated
  with check (
    user_id::text = (select auth.uid())::text
    and business_owner_id is not null
    and (
      business_owner_id::text is distinct from (select auth.uid())::text
      or public.moxt_is_staff_user(auth.uid())
    )
  );

notify pgrst, 'reload schema';
