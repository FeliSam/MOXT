-- E-mail « live » = uniquement Auth confirmé.
-- Un e-mail seulement sur profiles (non confirmé) ne doit plus bloquer
-- l’envoi du code de confirmation (« déjà lié à un compte »).
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
    where u.phone_confirmed_at is not null
      and public.moxt_normalize_identity_value('phone', coalesce(u.phone, '')) = v_value
    limit 1;

    if v_owner is not null then
      return v_owner;
    end if;

    select p.id
    into v_owner
    from public.profiles p
    where p.phone_verified is true
      and public.moxt_normalize_identity_value('phone', coalesce(p.phone, '')) = v_value
      and coalesce(p.phone, '') <> ''
    limit 1;

    return v_owner;
  end if;

  if p_kind = 'email' then
    select u.id
    into v_owner
    from auth.users u
    where u.email_confirmed_at is not null
      and public.moxt_normalize_identity_value('email', coalesce(u.email, '')) = v_value
    limit 1;

    return v_owner;
  end if;

  return null;
end;
$$;

notify pgrst, 'reload schema';
