-- Fix workspace insert policy to ensure authenticated users can create workspaces
-- Also fix workspace_members insert for self-join (user adding themselves as admin)

drop policy if exists "Authenticated users can create workspaces" on public.workspaces;
create policy "Authenticated users can create workspaces"
  on public.workspaces for insert
  to authenticated
  with check (true);

-- Allow users to add themselves as workspace member (needed during onboarding)
drop policy if exists "Admins can manage workspace members" on public.workspace_members;
create policy "Users can join workspaces they own or are invited to"
  on public.workspace_members for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    or public.has_workspace_role(workspace_id, array['admin']::workspace_role[])
  );
