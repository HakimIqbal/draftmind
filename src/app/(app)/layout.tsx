import { AppShell } from '@/components/layout/app-shell';
import { createClient } from '@/lib/supabase/server';
import { getUserWorkspaces, getCurrentWorkspace } from '@/lib/db/queries/workspace';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let workspaces;
  let currentWorkspaceId;
  let userName;
  let userEmail;

  if (user) {
    workspaces = await getUserWorkspaces(user.id);
    const ws = await getCurrentWorkspace(user.id);
    currentWorkspaceId = ws?.id;
    userName = (user.user_metadata as Record<string, string> | undefined)?.full_name ?? undefined;
    userEmail = user.email;
  }

  return (
    <AppShell
      workspaces={workspaces}
      currentWorkspaceId={currentWorkspaceId}
      userName={userName}
      userEmail={userEmail}
    >
      {children}
    </AppShell>
  );
}
