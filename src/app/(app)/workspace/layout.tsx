import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { redirect } from 'next/navigation';
import { WorkspaceLayoutShell } from '@/components/workspace/workspace-layout-shell';

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect('/dashboard');

  return (
    <WorkspaceLayoutShell workspaceName={workspace.name} currentUserRole={workspace.currentRole}>
      {children}
    </WorkspaceLayoutShell>
  );
}
