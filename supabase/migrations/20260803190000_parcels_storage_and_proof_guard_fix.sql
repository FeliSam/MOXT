-- Colis : bucket storage preuves + garde-statuts corrigée.
-- Problème : après upload billet/passeport, le sync échouait ou restait « missing »
-- car le trigger bloquait tout changement owner de proof_status / passport_status.

-- ── Storage bucket privé pour billet / passeport ─────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('parcels', 'parcels', false, 5242880)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = coalesce(storage.buckets.file_size_limit, excluded.file_size_limit);

drop policy if exists "MOXT users upload own parcel proofs" on storage.objects;
create policy "MOXT users upload own parcel proofs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'parcels'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "MOXT users update own parcel proofs" on storage.objects;
create policy "MOXT users update own parcel proofs"
on storage.objects for update to authenticated
using (
  bucket_id = 'parcels'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'parcels'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "MOXT users delete own parcel proofs" on storage.objects;
create policy "MOXT users delete own parcel proofs"
on storage.objects for delete to authenticated
using (
  bucket_id = 'parcels'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "MOXT users read own parcel proofs" on storage.objects;
create policy "MOXT users read own parcel proofs"
on storage.objects for select to authenticated
using (
  bucket_id = 'parcels'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.moxt_is_admin()
    or public.moxt_is_moderator()
    or exists (
      select 1
      from public.parcels p
      where p.id = (storage.foldername(name))[2]
        and (
          p.owner_id::text = (select auth.uid())::text
          or exists (
            select 1
            from public.parcel_requests r
            where r.parcel_id = p.id
              and r.user_id::text = (select auth.uid())::text
          )
        )
    )
  )
);

-- Colonnes passeport (idempotent si 20260803160000 déjà appliquée)
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

update public.parcels
set proof_status = 'missing'
where (travel_proof_url is null or btrim(travel_proof_url) = '')
  and proof_status = 'pending_review';

alter table public.parcels
  alter column proof_status set default 'missing';

-- Owner peut passer missing ↔ pending_review (upload / retrait doc).
-- Interdit : s'auto-valider (verified) ou s'auto-refuser (rejected).
-- Une fois verified, seul le staff peut changer le statut.
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
