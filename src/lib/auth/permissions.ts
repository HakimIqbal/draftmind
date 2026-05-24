import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logWarn } from '@/lib/logging/system-log';

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireWorkspaceMember(workspaceId: string) {
  const user = await requireUser();
  const admin = createAdminClient();

  // Use the service-role client after authenticating the user. Workspace membership
  // checks are authorization-critical and must not fail open/closed because of RLS
  // visibility differences in server actions.
  const { data: member } = await admin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (!member) {
    logWarn(
      'auth.workspace_access_denied',
      'User attempted to access a workspace they do not belong to',
      { workspaceId },
      user.id,
    );
    redirect('/dashboard');
  }

  return { user, role: member.role };
}

type WorkspaceRole = 'admin' | 'editor' | 'commenter' | 'viewer';

export async function requireWorkspaceRole(workspaceId: string, roles: WorkspaceRole[]) {
  const { user, role } = await requireWorkspaceMember(workspaceId);

  if (!roles.includes(role as WorkspaceRole)) {
    logWarn(
      'auth.workspace_role_denied',
      'User attempted an action without required workspace role',
      { workspaceId, currentRole: role, requiredRoles: roles },
      user.id,
    );
    redirect('/dashboard');
  }

  return { user, role };
}
