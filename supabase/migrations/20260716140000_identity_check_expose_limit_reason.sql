-- Anon: garder reason = 'limit' (UX claire) ; masquer seulement 'active' → 'unavailable'
-- pour limiter l'énumération de comptes confirmés.

create or replace function public.moxt_check_identity_available(
  p_kind text,
  p_value text,
  p_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_value text := public.moxt_normalize_identity_value(p_kind, p_value);
  v_total integer;
  v_live_owner uuid;
  v_available boolean := true;
  v_reason text := null;
begin
  if v_value = '' then
    return jsonb_build_object('available', true, 'reason', null);
  end if;

  perform public.moxt_cleanup_stale_identity_slots(p_kind, v_value);

  if p_user_id is not null and exists (
    select 1
    from public.account_identity_history h
    where h.identity_kind = p_kind
      and h.identity_value = v_value
      and h.user_id = p_user_id
      and h.released_at is null
  ) then
    return jsonb_build_object('available', true, 'reason', null);
  end if;

  v_live_owner := public.moxt_find_live_identity_owner(p_kind, v_value);
  if v_live_owner is not null and (p_user_id is null or v_live_owner <> p_user_id) then
    v_available := false;
    v_reason := 'active';
  end if;

  if v_available then
    select count(*)::integer
    into v_total
    from public.account_identity_history h
    where h.identity_kind = p_kind
      and h.identity_value = v_value;

    if v_total >= 2 then
      v_available := false;
      v_reason := 'limit';
    end if;
  end if;

  -- Anti-énumération: ne pas révéler qu'un compte confirmé existe.
  -- La limite lifetime (2) reste explicite pour orienter l'utilisateur.
  if auth.uid() is null and not v_available and v_reason = 'active' then
    return jsonb_build_object('available', false, 'reason', 'unavailable');
  end if;

  return jsonb_build_object('available', v_available, 'reason', v_reason);
end;
$$;

revoke all on function public.moxt_check_identity_available(text, text, uuid) from public;
grant execute on function public.moxt_check_identity_available(text, text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
