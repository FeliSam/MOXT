-- Allow phone_verified=true on INSERT when Auth already confirmed the phone (OTP signup).
-- Previously INSERT always forced phone_verified=false, so the first profile write after
-- SMS verify lost the verified flag until a later UPDATE/sync.

create or replace function private.moxt_profiles_privilege_guard()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_phone_confirmed boolean;
begin
  if tg_op = 'INSERT' then
    if not public.moxt_is_admin() then
      new.role := 'user';
      new.status := coalesce(nullif(new.status, ''), 'active');
      if new.status = 'verified' then
        new.status := 'active';
      end if;

      select u.phone_confirmed_at is not null
      into v_phone_confirmed
      from auth.users u
      where u.id = new.id;

      if coalesce(v_phone_confirmed, false) is not true then
        new.phone_verified := false;
        new.phone_verified_at := null;
      end if;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and not public.moxt_is_admin() then
    new.role := old.role;
    new.status := old.status;
    new.referral_code := old.referral_code;

    if new.phone_verified is distinct from old.phone_verified then
      if new.phone_verified = true then
        select u.phone_confirmed_at is not null
        into v_phone_confirmed
        from auth.users u
        where u.id = new.id;

        if coalesce(v_phone_confirmed, false) is not true then
          new.phone_verified := old.phone_verified;
          new.phone_verified_at := old.phone_verified_at;
        end if;
      else
        new.phone_verified := old.phone_verified;
        new.phone_verified_at := old.phone_verified_at;
      end if;
    end if;
  end if;

  return new;
end;
$$;
