import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { redirect } from 'next/navigation';
import { WorkspaceActivityTab } from '@/components/workspace/workspace-activity-tab';

export default async function WorkspaceActivityPage() {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect('/dashboard');

  // Only admin can access activity
  if (workspace.currentRole !== 'admin') redirect('/workspace/members');

  return <WorkspaceActivityTab workspaceId={workspace.id} />;
}
