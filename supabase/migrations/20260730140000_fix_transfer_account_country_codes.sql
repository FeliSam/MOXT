-- Repair corrupted transfer_accounts.country (e.g. numeric 1 instead of ISO "BJ")
-- and prevent exchanger list filters from hiding verified transfer businesses.

update public.businesses b
set
  transfer_accounts = coalesce((
    select jsonb_agg(
      case
        when coalesce(elem->>'slot', '') = 'ru' then
          elem || jsonb_build_object('country', 'RU', 'slot', 'ru')
        when coalesce(elem->>'slot', '') = 'origin'
          or (
            coalesce(elem->>'slot', '') = ''
            and coalesce(elem->>'country', '') is distinct from 'RU'
          )
        then
          elem || jsonb_build_object(
            'slot', 'origin',
            'country',
            case
              when jsonb_typeof(elem->'country') = 'string'
                   and length(trim(elem->>'country')) = 2
                   and upper(trim(elem->>'country')) ~ '^[A-Z]{2}$'
                   and upper(trim(elem->>'country')) <> 'RU'
              then upper(trim(elem->>'country'))
              else coalesce(
                nullif(upper(trim(p.origin_country)), ''),
                'BJ'
              )
            end
          )
        else elem
      end
      order by ordinality
    )
    from jsonb_array_elements(coalesce(b.transfer_accounts, '[]'::jsonb))
      with ordinality as t(elem, ordinality)
  ), '[]'::jsonb),
  updated_at = now()
from public.profiles p
where p.id::text = b.owner_id::text
  and exists (
    select 1
    from jsonb_array_elements(coalesce(b.transfer_accounts, '[]'::jsonb)) e
    where
      (
        coalesce(e->>'slot', '') = 'origin'
        or (
          coalesce(e->>'slot', '') = ''
          and coalesce(e->>'country', '') is distinct from 'RU'
        )
      )
      and (
        jsonb_typeof(e->'country') is distinct from 'string'
        or length(trim(coalesce(e->>'country', ''))) is distinct from 2
        or upper(trim(coalesce(e->>'country', ''))) !~ '^[A-Z]{2}$'
      )
  );

notify pgrst, 'reload schema';
