-- Profile creation is deferred until phone/email confirmation
-- (see 20260716100000_defer_profile_until_auth_confirmed).
-- The legacy public.handle_new_user trigger still inserted profiles on every
-- auth.users INSERT and fought that policy (orphan profiles before SMS verify).

drop trigger if exists on_auth_user_created on auth.users;

notify pgrst, 'reload schema';
