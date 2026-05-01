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
  let recentPRDs: { id: string; title: string }[] = [];

  if (user) {
    workspaces = await getUserWorkspaces(user.id);
    const ws = await getCurrentWorkspace(user.id);
    currentWorkspaceId = ws?.id;
    userName = (user.user_metadata as Record<string, string> | undefined)?.full_name ?? undefined;
    userEmail = user.email;

    if (currentWorkspaceId) {
      const { data: prds } = await supabase
        .from('prds')
        .select('id, title')
        .eq('workspace_id', currentWorkspaceId)
        .eq('owner_id', user.id)
        .is('archived_at', null)
        .order('updated_at', { ascending: false })
        .limit(5);
      recentPRDs = (prds ?? []).map((p) => ({ id: p.id, title: p.title ?? 'Untitled' }));
    }
  }

  return (
    <AppShell
      workspaces={workspaces}
      currentWorkspaceId={currentWorkspaceId}
      userName={userName}
      userEmail={userEmail}
      recentPRDs={recentPRDs}
    >
      {children}
    </AppShell>
  );
}
