import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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
  const supabase = await createClient();

  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (!member) {
    redirect('/dashboard');
  }

  return { user, role: member.role };
}

type WorkspaceRole = 'admin' | 'editor' | 'commenter' | 'viewer';

export async function requireWorkspaceRole(workspaceId: string, roles: WorkspaceRole[]) {
  const { user, role } = await requireWorkspaceMember(workspaceId);

  if (!roles.includes(role as WorkspaceRole)) {
    redirect('/dashboard');
  }

  return { user, role };
}
