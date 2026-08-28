-- Lecture publique des boosts actifs pour le feed + expiration batch.

drop policy if exists stars_boosts_feed_read on public.stars_boosts;
create policy stars_boosts_feed_read on public.stars_boosts
  for select to anon, authenticated
  using (status = 'active' and expires_at > now());

create or replace function public.stars_expire_boosts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.stars_boosts
  set status = 'expired'
  where status = 'active'
    and expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.stars_expire_boosts() to authenticated;
