-- Enforce two-party transfer workflow:
-- - client cannot create a transfer against their own business
-- - status transitions are role-bound (sender vs business owner)
-- Admins/superadmins/moderators may override.

create or replace function public.moxt_is_staff_user(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role in ('admin', 'superadmin', 'moderator')
  );
$$;

create or replace function public.moxt_enforce_transfer_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  is_staff boolean := false;
begin
  if uid is null then
    return new;
  end if;

  is_staff := public.moxt_is_staff_user(uid);

  if tg_op = 'INSERT' then
    if new.user_id = uid
       and new.business_owner_id is not distinct from new.user_id
       and not is_staff then
      raise exception 'TRANSFER_SELF_BUSINESS: cannot create a transfer to your own business';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    if is_staff then
      return new;
    end if;

    -- Sender actions
    if old.status = 'pending_payment' and new.status = 'payment_declared' then
      if uid is distinct from new.user_id then
        raise exception 'TRANSFER_ROLE: only the sender can declare payment';
      end if;
      return new;
    end if;

    if old.status in ('pending_payment', 'payment_declared') and new.status = 'cancelled' then
      if uid is distinct from new.user_id then
        raise exception 'TRANSFER_ROLE: only the sender can cancel';
      end if;
      return new;
    end if;

    if old.status = 'paid_out' and new.status = 'completed' then
      if uid is distinct from new.user_id then
        raise exception 'TRANSFER_ROLE: only the sender can declare reception / complete';
      end if;
      return new;
    end if;

    if old.status = 'pending_payment' and new.status = 'expired' then
      -- Either party (or client-side expiry sync) may mark expired.
      return new;
    end if;

    -- Business actions — never the same person as the sender
    if old.status = 'payment_declared' and new.status = 'payment_received' then
      if uid is distinct from new.business_owner_id or uid = new.user_id then
        raise exception 'TRANSFER_ROLE: only the partner business can confirm payment reception';
      end if;
      return new;
    end if;

    if old.status in ('payment_received', 'processing') and new.status = 'paid_out' then
      if uid is distinct from new.business_owner_id or uid = new.user_id then
        raise exception 'TRANSFER_ROLE: only the partner business can confirm payout';
      end if;
      return new;
    end if;

    raise exception 'TRANSFER_TRANSITION: invalid status change from % to %', old.status, new.status;
  end if;

  return new;
end;
$$;

drop trigger if exists moxt_enforce_transfer_roles on public.transfers;
create trigger moxt_enforce_transfer_roles
  before insert or update on public.transfers
  for each row
  execute function public.moxt_enforce_transfer_roles();

drop policy if exists "MOXT insert transfers" on public.transfers;
create policy "MOXT insert transfers" on public.transfers
  for insert to authenticated
  with check (
    user_id::text = (select auth.uid())::text
    and (
      business_owner_id is null
      or business_owner_id::text is distinct from (select auth.uid())::text
      or public.moxt_is_staff_user(auth.uid())
    )
  );

notify pgrst, 'reload schema';
