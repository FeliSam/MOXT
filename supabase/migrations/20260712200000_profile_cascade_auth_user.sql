-- Suppression définitive du profil → suppression de auth.users (libère e-mail / téléphone).

create or replace function private.moxt_cascade_delete_auth_user()
returns trigger
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  delete from auth.users where id = old.id;
  return old;
end;
$$;

revoke all on function private.moxt_cascade_delete_auth_user() from public, anon, authenticated;

drop trigger if exists moxt_profiles_cascade_auth_user on public.profiles;
create trigger moxt_profiles_cascade_auth_user
  after delete on public.profiles
  for each row
  execute function private.moxt_cascade_delete_auth_user();

drop policy if exists "MOXT admin delete profiles" on public.profiles;
create policy "MOXT admin delete profiles"
  on public.profiles
  for delete
  to authenticated
  using (public.moxt_is_admin());

grant delete on table public.profiles to authenticated;

create or replace function public.moxt_purge_user_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  if p_user_id is null then
    raise exception 'Utilisateur invalide';
  end if;

  if auth.uid() is distinct from p_user_id and not public.moxt_is_admin() then
    raise exception 'Accès refusé';
  end if;

  if auth.uid() = p_user_id and not exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.status = 'pending_deletion'
  ) then
    raise exception 'Suppression non autorisée';
  end if;

  delete from public.profiles where id = p_user_id;

  if exists (select 1 from auth.users u where u.id = p_user_id) then
    delete from auth.users where id = p_user_id;
  end if;

  update public.account_deletion_requests r
  set
    status = 'processed',
    processed_at = coalesce(r.processed_at, now())
  where r.user_id = p_user_id
    and r.status = 'requested';
end;
$$;

revoke all on function public.moxt_purge_user_account(uuid) from public;
grant execute on function public.moxt_purge_user_account(uuid) to authenticated;

-- Comptes auth orphelins (profil supprimé sans auth) : libère e-mail / téléphone bloqués.
delete from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.id = u.id
);

select public.moxt_cleanup_stale_identity_slots(null, null);

notify pgrst, 'reload schema';
