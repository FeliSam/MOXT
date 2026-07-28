-- Épinglage d'une entreprise / d'un échangeur par un administrateur.
--
-- Permet de mettre en avant un partenaire fiable en tête du choix du
-- partenaire (formulaire de transfert), de l'annuaire des échangeurs et de
-- l'annuaire professionnel — sans toucher au classement naturel des autres.

alter table public.businesses
  add column if not exists pinned_at timestamptz,
  add column if not exists pinned_by uuid;

comment on column public.businesses.pinned_at is
  'Épinglé par un admin : remonte en tête des listes. NULL = non épinglé.';

create index if not exists businesses_pinned_at_idx
  on public.businesses (pinned_at desc nulls last);

/**
 * Épingle / désépingle une entreprise. Réservé aux admins : la colonne ne doit
 * pas être modifiable par le propriétaire de l'entreprise, sinon chacun se
 * placerait en tête de liste.
 */
create or replace function public.moxt_set_business_pinned(
  p_business_id text,
  p_pinned boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.moxt_is_admin() then
    raise exception 'Réservé aux administrateurs.';
  end if;

  update public.businesses
  set pinned_at = case when p_pinned then now() else null end,
      pinned_by = case when p_pinned then (select auth.uid()) else null end,
      updated_at = now()
  where id = p_business_id;

  if not found then
    raise exception 'Entreprise introuvable.';
  end if;

  return p_pinned;
end;
$$;

revoke all on function public.moxt_set_business_pinned(text, boolean) from public;
grant execute on function public.moxt_set_business_pinned(text, boolean) to authenticated;

notify pgrst, 'reload schema';
