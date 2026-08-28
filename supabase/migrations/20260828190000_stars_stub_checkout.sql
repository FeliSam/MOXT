-- Paiement test (provider stub) : le propriétaire peut confirmer ou échouer son achat pending.

create or replace function public.stars_complete_stub_purchase(
  p_purchase_id uuid,
  p_success boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.stars_purchases;
  v_total integer;
begin
  select * into v_row from public.stars_purchases where id = p_purchase_id for update;
  if not found then
    raise exception 'Achat introuvable';
  end if;

  perform public.moxt_stars_assert_owner(v_row.owner_type, v_row.owner_id);

  if coalesce(v_row.provider, 'stub') <> 'stub' then
    raise exception 'Paiement test indisponible pour ce provider';
  end if;

  if v_row.status = 'paid' then
    return jsonb_build_object('ok', true, 'status', 'paid', 'idempotent', true, 'stars', v_row.stars + v_row.bonus_stars);
  end if;

  if v_row.status is distinct from 'pending' then
    raise exception 'Achat non payable';
  end if;

  if not coalesce(p_success, true) then
    update public.stars_purchases
    set status = 'failed', updated_at = now()
    where id = p_purchase_id;
    return jsonb_build_object('ok', true, 'status', 'failed');
  end if;

  v_total := v_row.stars + v_row.bonus_stars;
  perform public.stars_credit(
    v_row.owner_type, v_row.owner_id, v_total,
    'Achat pack ' || coalesce(v_row.package_id, ''),
    'purchase', v_row.id::text,
    'purchase:' || v_row.id::text
  );

  update public.stars_purchases
  set status = 'paid', paid_at = now(), updated_at = now()
  where id = p_purchase_id;

  return jsonb_build_object('ok', true, 'status', 'paid', 'stars', v_total);
end;
$$;

grant execute on function public.stars_complete_stub_purchase(uuid, boolean) to authenticated;
