-- Allow users to update their own pending verification requests.
-- Needed because the web client reuses one pending row (insert then re-submit),
-- while PostgREST upsert / updates require an UPDATE RLS policy.
-- Status cannot leave the pending/submitted set (admins still approve/reject).

drop policy if exists "MOXT users update own pending verification" on public.verification_requests;
create policy "MOXT users update own pending verification"
  on public.verification_requests
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and status in ('pending', 'pending_review', 'submitted')
  )
  with check (
    user_id = (select auth.uid())
    and status in ('pending', 'pending_review', 'submitted')
  );
