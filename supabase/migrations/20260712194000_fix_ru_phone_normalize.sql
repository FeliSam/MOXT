-- Aligner la normalisation téléphone RU avec le client (79991234567 → +79991234567).

create or replace function public.moxt_normalize_ru_phone(p_value text)
returns text
language plpgsql
immutable
as $$
declare
  v_trimmed text := trim(coalesce(p_value, ''));
  v_has_plus boolean := v_trimmed like '+%';
  v_digits text := regexp_replace(v_trimmed, '\D', '', 'g');
begin
  if v_digits = '' then
    return '';
  end if;
  if v_digits ~ '^8\d{10}$' then
    return '+7' || substring(v_digits from 2);
  end if;
  if v_digits ~ '^7\d{10}$' then
    return '+' || v_digits;
  end if;
  if v_has_plus then
    return '+' || v_digits;
  end if;
  return v_digits;
end;
$$;

notify pgrst, 'reload schema';
