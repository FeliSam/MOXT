-- Correctif : cast owner_id pour compatibilité text/uuid sur businesses

create or replace function public.moxt_owns_business(bid text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.businesses b
    where b.id = bid and b.owner_id::text = (select auth.uid())::text
  );
$$;

drop policy if exists "MOXT publisher subscriptions publisher read" on public.publisher_subscriptions;
create policy "MOXT publisher subscriptions publisher read"
  on public.publisher_subscriptions
  for select
  to authenticated
  using (
    (publisher_type = 'user' and publisher_id = auth.uid()::text)
    or (
      publisher_type = 'business'
      and exists (
        select 1
        from public.businesses b
        where b.id = publisher_id
          and b.owner_id::text = auth.uid()::text
      )
    )
  );

notify pgrst, 'reload schema';
