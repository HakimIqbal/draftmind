import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { WorkspaceMembersTab } from '@/components/workspace/workspace-members-tab';
import { WorkspaceMembersPoller } from './workspace-members-poller';
import type { WorkspaceMemberItem, WorkspaceInvitationItem } from '@/app/(app)/workspace/page';

export const dynamic = 'force-dynamic';

export default async function WorkspaceMembersPage() {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect('/dashboard');

  const supabase = await createClient();

  const [membersR, invitationsR] = await Promise.all([
    supabase
      .from('workspace_members')
      .select(
        'user_id, role, joined_at, last_active_at, profile:profiles(full_name, email, avatar_color_seed, avatar_url, role_self_reported)',
      )
      .eq('workspace_id', workspace.id)
      .order('joined_at', { ascending: true }),
    supabase
      .from('workspace_invitations')
      .select('id, email, role, created_at, expires_at, accepted_at, revoked_at')
      .eq('workspace_id', workspace.id)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),
  ]);

  // Check disabled/banned status for workspace members
  const memberIds = (membersR.data ?? []).map((m) => m.user_id);
  const disabledIds = new Set<string>();
  if (memberIds.length > 0) {
    const admin = createAdminClient();
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (authData?.users) {
      for (const u of authData.users) {
        if (memberIds.includes(u.id) && u.banned_until && new Date(u.banned_until) > new Date()) {
          disabledIds.add(u.id);
        }
      }
    }
  }

  return (
    <>
      <WorkspaceMembersPoller />
      <WorkspaceMembersTab
        workspaceId={workspace.id}
        currentUserId={user.id}
        currentUserRole={workspace.currentRole}
        members={(membersR.data as unknown as WorkspaceMemberItem[]) ?? []}
        invitations={(invitationsR.data as WorkspaceInvitationItem[]) ?? []}
        disabledUserIds={[...disabledIds]}
      />
    </>
  );
}
