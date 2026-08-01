-- Permet à un admin/superadmin de valider manuellement le numéro de téléphone
-- d'un utilisateur (cas : OTP jamais reçu après plusieurs essais, mais le
-- numéro est confirmé fonctionnel par un autre canal). Restreint à moxt_is_admin()
-- (pas moxt_is_moderator) : aligné sur la séparation existante KYC/documents
-- réservée à l'admin (cf. 20260718150000_moderator_role.sql).

create or replace function public.moxt_admin_verify_phone(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.moxt_is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  update public.profiles
  set phone_verified = true,
      phone_verified_at = coalesce(phone_verified_at, now()),
      updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'Utilisateur introuvable.';
  end if;
end;
$$;

revoke all on function public.moxt_admin_verify_phone(uuid) from public;
grant execute on function public.moxt_admin_verify_phone(uuid) to authenticated;

notify pgrst, 'reload schema';
