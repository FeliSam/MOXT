-- Bucket privé pour les preuves de transfert
insert into storage.buckets (id, name, public)
values ('transfers', 'transfers', false)
on conflict (id) do update set public = false;

drop policy if exists "MOXT users upload own transfer proofs" on storage.objects;
create policy "MOXT users upload own transfer proofs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'transfers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "MOXT users update own transfer proofs" on storage.objects;
create policy "MOXT users update own transfer proofs"
on storage.objects for update to authenticated
using (
  bucket_id = 'transfers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'transfers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "MOXT users delete own transfer proofs" on storage.objects;
create policy "MOXT users delete own transfer proofs"
on storage.objects for delete to authenticated
using (
  bucket_id = 'transfers'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "MOXT read transfer proofs as participant" on storage.objects;
create policy "MOXT read transfer proofs as participant"
on storage.objects for select to authenticated
using (
  bucket_id = 'transfers'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1
      from public.transfers t
      where (
        t.id = (storage.foldername(name))[2]
        or (storage.foldername(name))[2] like t.id || '-receive'
      )
      and (
        t.user_id::text = (select auth.uid())::text
        or t.business_owner_id::text = (select auth.uid())::text
      )
    )
  )
);
