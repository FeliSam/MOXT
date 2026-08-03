-- Colis : passeport optionnel + statuts de preuves séparés (billet / passeport).
-- Publication possible sans documents (status missing) ; avec docs → pending_review.

alter table public.parcels
  add column if not exists passport_proof_url text;

alter table public.parcels
  add column if not exists passport_status text;

update public.parcels
set passport_status = 'missing'
where passport_status is null;

alter table public.parcels
  alter column passport_status set default 'missing';

alter table public.parcels
  alter column passport_status set not null;

-- Annonces sans billet : passer de pending_review forcé à missing
update public.parcels
set proof_status = 'missing'
where (travel_proof_url is null or btrim(travel_proof_url) = '')
  and proof_status = 'pending_review';

alter table public.parcels
  alter column proof_status set default 'missing';

-- Owner cannot self-verify passport_status / proof_status (verified|rejected).
-- Owner MAY switch missing ↔ pending_review when uploading or removing docs.
create or replace function private.moxt_parcels_proof_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and not public.moxt_is_admin()
     and not public.moxt_is_moderator() then
    if new.proof_status is distinct from old.proof_status then
      if old.proof_status = 'verified'
         or new.proof_status in ('verified', 'rejected') then
        new.proof_status := old.proof_status;
      elsif new.proof_status not in ('missing', 'pending_review') then
        new.proof_status := old.proof_status;
      end if;
    end if;
    if new.passport_status is distinct from old.passport_status then
      if old.passport_status = 'verified'
         or new.passport_status in ('verified', 'rejected') then
        new.passport_status := old.passport_status;
      elsif new.passport_status not in ('missing', 'pending_review') then
        new.passport_status := old.passport_status;
      end if;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.moxt_parcels_proof_guard() from public, anon, authenticated;

drop trigger if exists moxt_parcels_proof_guard on public.parcels;
create trigger moxt_parcels_proof_guard
  before update on public.parcels
  for each row
  execute function private.moxt_parcels_proof_guard();
