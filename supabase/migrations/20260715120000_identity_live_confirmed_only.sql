-- Ne bloquer l'inscription que si l'e-mail / téléphone est réellement confirmé.
-- Les comptes SMS abandonnés (auth.users sans phone_confirmed_at, profils non vérifiés)
-- ne doivent plus remonter "compte déjà existant" sur une nouvelle tentative.

create or replace function public.moxt_find_live_identity_owner(
  p_kind text,
  p_value text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_value text := public.moxt_normalize_identity_value(p_kind, p_value);
  v_owner uuid;
begin
  if v_value = '' then
    return null;
  end if;

  if p_kind = 'phone' then
    select u.id
    into v_owner
    from auth.users u
    where public.moxt_normalize_identity_value('phone', coalesce(u.phone, '')) = v_value
      and u.phone_confirmed_at is not null
    limit 1;

    if v_owner is not null then
      return v_owner;
    end if;

    select p.id
    into v_owner
    from public.profiles p
    where public.moxt_normalize_identity_value('phone', coalesce(p.phone, '')) = v_value
      and coalesce(p.phone, '') <> ''
      and coalesce(p.phone_verified, false) = true
    limit 1;

    return v_owner;
  end if;

  if p_kind = 'email' then
    select u.id
    into v_owner
    from auth.users u
    where public.moxt_normalize_identity_value('email', coalesce(u.email, '')) = v_value
      and u.email_confirmed_at is not null
    limit 1;

    if v_owner is not null then
      return v_owner;
    end if;

    -- E-mail en metadata / profil après signup téléphone non finalisé : ne bloque pas.
    -- Réserve l'adresse seulement pour un compte qui a confirmé téléphone ou e-mail.
    select p.id
    into v_owner
    from public.profiles p
    where public.moxt_normalize_identity_value('email', coalesce(p.email, '')) = v_value
      and coalesce(p.email, '') <> ''
      and (
        coalesce(p.phone_verified, false) = true
        or exists (
          select 1
          from auth.users u
          where u.id = p.id
            and u.email_confirmed_at is not null
        )
      )
    limit 1;

    return v_owner;
  end if;

  return null;
end;
$$;

revoke all on function public.moxt_find_live_identity_owner(text, text) from public;

notify pgrst, 'reload schema';
