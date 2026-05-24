-- Prevent duplicate pending invitations for the same email inside the same workspace.
-- A user may still be invited to different workspaces, but only one pending invite
-- per (workspace_id, email) should exist at a time.

delete from public.workspace_invitations wi
using (
  select
    id,
    row_number() over (
      partition by workspace_id, lower(email)
      order by created_at desc, id desc
    ) as rn
  from public.workspace_invitations
  where accepted_at is null
    and revoked_at is null
) dup
where wi.id = dup.id
  and dup.rn > 1;

create unique index if not exists workspace_invitations_workspace_email_pending_key
  on public.workspace_invitations (workspace_id, lower(email))
  where accepted_at is null
    and revoked_at is null;
