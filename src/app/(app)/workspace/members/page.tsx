import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createClient } from '@/lib/supabase/server';
import { MembersTable } from '@/components/workspace/members-table';

export interface WorkspaceMember {
  user_id: string;
  role: string;
  joined_at: string;
  last_active_at: string | null;
  profile: {
    full_name: string | null;
    email: string;
    avatar_color_seed: string | null;
  };
}

export interface WorkspaceInvitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

export default async function WorkspaceMembersPage() {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);

  if (!workspace) {
    return null;
  }

  const supabase = await createClient();

  // Fetch workspace members with profile info
  const { data: members } = await supabase
    .from('workspace_members')
    .select(
      'user_id, role, joined_at, last_active_at, profile:profiles(full_name, email, avatar_color_seed)',
    )
    .eq('workspace_id', workspace.id)
    .order('joined_at', { ascending: true });

  // Fetch pending invitations (not accepted, not revoked, not expired)
  const { data: invitations } = await supabase
    .from('workspace_invitations')
    .select('id, email, role, created_at, expires_at, accepted_at, revoked_at')
    .eq('workspace_id', workspace.id)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  return (
    <MembersTable
      workspaceId={workspace.id}
      currentUserId={user.id}
      currentUserRole={workspace.currentRole}
      members={(members as unknown as WorkspaceMember[]) ?? []}
      invitations={(invitations as WorkspaceInvitation[]) ?? []}
    />
  );
}
