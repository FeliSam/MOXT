-- Clôture automatique paid_out → completed après 24 h
-- si les deux preuves (client + échangeur) sont présentes et aucun litige ouvert.

create or replace function public.moxt_transfer_has_named_proof(p_proof jsonb)
returns boolean
language sql
immutable
as $$
  select p_proof is not null
    and (
      coalesce(nullif(p_proof->>'name', ''), '') <> ''
      or coalesce(nullif(p_proof->>'url', ''), '') <> ''
      or coalesce(nullif(p_proof->>'path', ''), '') <> ''
    );
$$;

create or replace function public.moxt_transfer_has_open_dispute(p_transfer_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.disputes d
    where d.related_type = 'transfer'
      and d.related_id = p_transfer_id
      and lower(coalesce(d.status, '')) not in ('resolved', 'closed')
  );
$$;

create or replace function public.moxt_transfer_paid_out_at(p_row public.transfers)
returns timestamptz
language sql
stable
security definer
set search_path = public, private
as $$
  select coalesce(
    private.moxt_timeline_status_at(p_row.timeline, 'paid_out'),
    p_row.updated_at,
    p_row.created_at
  );
$$;

create or replace function public.moxt_transfer_can_auto_complete(p_row public.transfers)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select p_row.status = 'paid_out'
    and public.moxt_transfer_has_named_proof(p_row.payment_proof)
    and public.moxt_transfer_has_named_proof(p_row.business_proof)
    and not public.moxt_transfer_has_open_dispute(p_row.id)
    and public.moxt_transfer_paid_out_at(p_row) <= now() - interval '24 hours';
$$;

create or replace function public.moxt_enforce_transfer_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid text := (select auth.uid())::text;
  is_staff boolean := false;
  business_changed boolean := false;
begin
  if uid is null or uid = '' then
    return new;
  end if;

  is_staff := public.moxt_is_staff_user(auth.uid());

  if tg_op = 'INSERT' then
    if new.user_id::text = uid
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

    business_changed :=
      old.business_id is distinct from new.business_id
      or old.business_owner_id is distinct from new.business_owner_id;

    if old.status in ('business_declined', 'pending_business_acceptance')
       and new.status in ('pending_business_acceptance', 'pending_payment')
       and business_changed then
      if uid is distinct from new.user_id::text then
        raise exception 'TRANSFER_ROLE: only the sender can reassign the exchanger';
      end if;
      return new;
    end if;

    if old.status = 'pending_business_acceptance'
       and new.status = 'pending_payment'
       and not business_changed then
      if uid is distinct from new.business_owner_id::text or uid = new.user_id::text then
        raise exception 'TRANSFER_ROLE: only the partner business can accept the transfer request';
      end if;
      return new;
    end if;

    if old.status = 'pending_business_acceptance' and new.status = 'business_declined' then
      if uid = new.user_id::text
         and uid is distinct from coalesce(new.business_owner_id::text, '') then
        return new;
      end if;
      if uid is distinct from new.business_owner_id::text or uid = new.user_id::text then
        raise exception 'TRANSFER_ROLE: only the partner business can decline the transfer request';
      end if;
      return new;
    end if;

    if old.status in (
         'pending_payment',
         'payment_declared',
         'pending_business_acceptance',
         'business_declined'
       )
       and new.status = 'cancelled' then
      if uid is distinct from new.user_id::text then
        raise exception 'TRANSFER_ROLE: only the sender can cancel';
      end if;
      return new;
    end if;

    if old.status = 'pending_payment' and new.status = 'payment_declared' then
      if uid is distinct from new.user_id::text then
        raise exception 'TRANSFER_ROLE: only the sender can declare payment';
      end if;
      return new;
    end if;

    if old.status = 'paid_out' and new.status = 'completed' then
      if uid is not distinct from new.user_id::text then
        return new;
      end if;
      if public.moxt_transfer_can_auto_complete(old)
         and (
           uid is not distinct from new.business_owner_id::text
           or uid is not distinct from new.user_id::text
         ) then
        return new;
      end if;
      raise exception 'TRANSFER_ROLE: only the sender can declare reception / complete';
    end if;

    if old.status = 'pending_payment' and new.status = 'expired' then
      return new;
    end if;

    if old.status = 'payment_declared' and new.status = 'payment_received' then
      if uid is distinct from new.business_owner_id::text or uid = new.user_id::text then
        raise exception 'TRANSFER_ROLE: only the partner business can confirm payment reception';
      end if;
      return new;
    end if;

    if old.status in ('payment_received', 'processing') and new.status = 'paid_out' then
      if uid is distinct from new.business_owner_id::text or uid = new.user_id::text then
        raise exception 'TRANSFER_ROLE: only the partner business can confirm payout';
      end if;
      return new;
    end if;

    raise exception 'TRANSFER_TRANSITION: invalid status change from % to %', old.status, new.status;
  end if;

  return new;
end;
$$;

create or replace function public.moxt_auto_complete_paid_out_transfers()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  rec public.transfers;
  v_now timestamptz := now();
  v_timeline jsonb;
begin
  for rec in
    select t.*
    from public.transfers t
    where public.moxt_transfer_can_auto_complete(t)
  loop
    v_timeline := coalesce(rec.timeline, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'status', 'completed',
        'at', v_now,
        'actorType', 'system',
        'note', 'auto_completed_after_24h'
      )
    );

    update public.transfers
    set
      status = 'completed',
      timeline = v_timeline,
      updated_at = v_now,
      payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object('receivedAt', v_now)
    where id = rec.id
      and status = 'paid_out';

    if found then
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.moxt_auto_complete_paid_out_transfers() from public, anon, authenticated;

create extension if not exists pg_cron;

select cron.schedule(
  'moxt-auto-complete-paid-out',
  '*/15 * * * *',
  $$select public.moxt_auto_complete_paid_out_transfers();$$
)
where not exists (
  select 1 from cron.job where jobname = 'moxt-auto-complete-paid-out'
);

notify pgrst, 'reload schema';
