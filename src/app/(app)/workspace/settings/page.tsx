import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WorkspaceSettingsTab } from '@/components/workspace/workspace-settings-tab';

export default async function WorkspaceSettingsPage() {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect('/dashboard');

  // Only admin can access settings
  if (workspace.currentRole !== 'admin') redirect('/workspace/members');

  const supabase = await createClient();
  const { data: ws } = await supabase
    .from('workspaces')
    .select('id, name, slug, industry, team_size, owner_id, icon_custom_url')
    .eq('id', workspace.id)
    .single();

  if (!ws) redirect('/dashboard');

  return (
    <WorkspaceSettingsTab
      workspace={ws}
      isOwner={ws.owner_id === user.id}
      isAdmin={workspace.currentRole === 'admin'}
    />
  );
}
