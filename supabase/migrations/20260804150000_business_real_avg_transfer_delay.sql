-- Délai réel moyen par échangeur (réception → virement), exposé sur businesses.

alter table public.businesses
  add column if not exists real_avg_delay_minutes numeric,
  add column if not exists real_avg_delay_samples integer not null default 0;

comment on column public.businesses.real_avg_delay_minutes is
  'Moyenne minutes payment_received → paid_out (transferts terminés).';
comment on column public.businesses.real_avg_delay_samples is
  'Nombre d’échantillons utilisés pour real_avg_delay_minutes.';

create or replace function private.moxt_timeline_status_at(p_timeline jsonb, p_status text)
returns timestamptz
language sql
immutable
as $$
  select (
    select coalesce(
      nullif(elem->>'at', '')::timestamptz,
      nullif(elem->>'createdAt', '')::timestamptz,
      nullif(elem->>'created_at', '')::timestamptz
    )
    from jsonb_array_elements(coalesce(p_timeline, '[]'::jsonb)) as elem
    where elem->>'status' = p_status
    order by coalesce(
      nullif(elem->>'at', '')::timestamptz,
      nullif(elem->>'createdAt', '')::timestamptz,
      nullif(elem->>'created_at', '')::timestamptz
    ) asc nulls last
    limit 1
  );
$$;

create or replace function public.moxt_refresh_business_real_avg_delay(p_business_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avg numeric;
  v_count int;
begin
  if coalesce(nullif(trim(p_business_id), ''), '') = '' then
    return;
  end if;

  select
    avg(extract(epoch from (paid_at - received_at)) / 60.0),
    count(*)::int
  into v_avg, v_count
  from (
    select
      private.moxt_timeline_status_at(t.timeline, 'payment_received') as received_at,
      private.moxt_timeline_status_at(t.timeline, 'paid_out') as paid_at
    from public.transfers t
    where t.business_id = p_business_id
      and t.status in ('paid_out', 'completed')
  ) s
  where received_at is not null
    and paid_at is not null
    and paid_at >= received_at
    and paid_at < received_at + interval '14 days';

  update public.businesses
  set
    real_avg_delay_minutes = case
      when coalesce(v_count, 0) > 0 then round(v_avg::numeric, 1)
      else null
    end,
    real_avg_delay_samples = coalesce(v_count, 0),
    updated_at = now()
  where id = p_business_id;
end;
$$;

revoke all on function public.moxt_refresh_business_real_avg_delay(text) from public;
grant execute on function public.moxt_refresh_business_real_avg_delay(text) to authenticated;

create or replace function public.moxt_transfers_refresh_business_delay()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.business_id is not null
       and (
         new.status is distinct from old.status
         or new.timeline is distinct from old.timeline
       )
       and new.status in ('paid_out', 'completed', 'payment_received', 'processing') then
      perform public.moxt_refresh_business_real_avg_delay(new.business_id);
    end if;
    if old.business_id is not null
       and old.business_id is distinct from new.business_id then
      perform public.moxt_refresh_business_real_avg_delay(old.business_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists transfers_refresh_business_delay on public.transfers;
create trigger transfers_refresh_business_delay
  after update of status, timeline, business_id on public.transfers
  for each row
  execute function public.moxt_transfers_refresh_business_delay();

-- Backfill one-shot
do $$
declare
  r record;
begin
  for r in
    select distinct business_id
    from public.transfers
    where business_id is not null
      and status in ('paid_out', 'completed')
  loop
    perform public.moxt_refresh_business_real_avg_delay(r.business_id);
  end loop;
end;
$$;

notify pgrst, 'reload schema';
