-- Notify transfer parties (chosen exchanger + client) on create and reassignment.
-- Superadmins already receive progress alerts via moxt_notify_superadmins_transfer_progress.
-- Stable notification ids match the client so RPC + trigger do not duplicate rows.

create or replace function public.moxt_notify_transfer_parties()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_prev_owner uuid;
  v_client uuid;
  v_name text;
  v_id text;
  v_needs_acceptance boolean;
begin
  v_id := coalesce(new.id, '');
  v_client := new.user_id;
  v_name := left(coalesce(nullif(trim(new.exchanger->>'name'), ''), 'échangeur'), 80);
  v_needs_acceptance := new.status = 'pending_business_acceptance';

  v_owner := new.business_owner_id;
  if v_owner is null and coalesce(new.business_id, '') <> '' then
    select b.owner_id
      into v_owner
    from public.businesses b
    where b.id = new.business_id
    limit 1;
  end if;

  if tg_op = 'INSERT' then
    if v_owner is not null then
      insert into public.notifications (
        id, user_id, title, message, type, link, priority, read, archived, created_at, updated_at
      ) values (
        left('NOT-TRF-EXC-' || v_id, 60),
        v_owner,
        case when v_needs_acceptance then 'Demande d’acceptation' else 'Nouveau transfert reçu' end,
        case when v_needs_acceptance
          then left(coalesce(new.sender->>'firstName', 'Un client') || ' attend votre acceptation pour ' || v_id || '.', 500)
          else left(coalesce(new.sender->>'firstName', 'Un client') || ' a choisi votre entreprise pour ' || v_id || '.', 500)
        end,
        'transfer',
        '/transfers/' || v_id,
        case when v_needs_acceptance then 'high' else 'normal' end,
        false,
        false,
        now(),
        now()
      )
      on conflict (id) do update
        set title = excluded.title,
            message = excluded.message,
            link = excluded.link,
            priority = excluded.priority,
            read = false,
            archived = false,
            updated_at = now();
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.business_id is distinct from old.business_id then
    v_prev_owner := old.business_owner_id;
    if v_prev_owner is null and coalesce(old.business_id, '') <> '' then
      select b.owner_id
        into v_prev_owner
      from public.businesses b
      where b.id = old.business_id
      limit 1;
    end if;

    if v_prev_owner is not null and v_prev_owner is distinct from v_owner then
      insert into public.notifications (
        id, user_id, title, message, type, link, priority, read, archived, created_at, updated_at
      ) values (
        left('NOT-TRF-AWAY-' || v_id, 60),
        v_prev_owner,
        'Transfert réassigné',
        left('Le transfert ' || v_id || ' a été confié à un autre échangeur.', 500),
        'transfer',
        '/transfers/' || v_id,
        'normal',
        false,
        false,
        now(),
        now()
      )
      on conflict (id) do update
        set title = excluded.title,
            message = excluded.message,
            link = excluded.link,
            read = false,
            archived = false,
            updated_at = now();
    end if;

    if v_owner is not null then
      insert into public.notifications (
        id, user_id, title, message, type, link, priority, read, archived, created_at, updated_at
      ) values (
        left('NOT-TRF-EXC-' || v_id, 60),
        v_owner,
        case when v_needs_acceptance then 'Demande d’acceptation' else 'Nouveau transfert reçu' end,
        case when v_needs_acceptance
          then left(coalesce(new.sender->>'firstName', 'Un client') || ' attend votre acceptation pour ' || v_id || '.', 500)
          else left(coalesce(new.sender->>'firstName', 'Un client') || ' a choisi votre entreprise pour ' || v_id || '.', 500)
        end,
        'transfer',
        '/transfers/' || v_id,
        'high',
        false,
        false,
        now(),
        now()
      )
      on conflict (id) do update
        set title = excluded.title,
            message = excluded.message,
            link = excluded.link,
            priority = excluded.priority,
            read = false,
            archived = false,
            updated_at = now();
    end if;

    if v_client is not null then
      insert into public.notifications (
        id, user_id, title, message, type, link, priority, read, archived, created_at, updated_at
      ) values (
        left('NOT-TRF-CLI-' || v_id, 60),
        v_client,
        'Transfert réassigné',
        left('Le transfert ' || v_id || ' a été confié à ' || v_name || '.', 500),
        'transfer',
        '/transfers/' || v_id,
        'high',
        false,
        false,
        now(),
        now()
      )
      on conflict (id) do update
        set title = excluded.title,
            message = excluded.message,
            link = excluded.link,
            priority = excluded.priority,
            read = false,
            archived = false,
            updated_at = now();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists transfers_notify_parties on public.transfers;
create trigger transfers_notify_parties
  after insert or update of business_id, business_owner_id, status on public.transfers
  for each row
  execute function public.moxt_notify_transfer_parties();

revoke all on function public.moxt_notify_transfer_parties() from public, anon;
notify pgrst, 'reload schema';
