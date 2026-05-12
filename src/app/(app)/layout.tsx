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
  let currentUserRole: string | undefined;
  let userName;
  let userEmail;
  let userAvatarUrl: string | undefined;
  let recentPRDs: { id: string; title: string }[] = [];

  if (user) {
    workspaces = await getUserWorkspaces(user.id);
    const ws = await getCurrentWorkspace(user.id);
    currentWorkspaceId = ws?.id;
    currentUserRole = ws?.currentRole;
    userName = (user.user_metadata as Record<string, string> | undefined)?.full_name ?? undefined;
    userEmail = user.email;

    // Fetch avatar URL from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url, full_name')
      .eq('id', user.id)
      .single();
    if (profile?.avatar_url) userAvatarUrl = profile.avatar_url;
    if (profile?.full_name) userName = profile.full_name;

    if (currentWorkspaceId) {
      const [prdsResult] = await Promise.all([
        supabase
          .from('prds')
          .select('id, title')
          .eq('workspace_id', currentWorkspaceId)
          .eq('owner_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(5),
        // Update last_active_at for the current workspace member
        supabase
          .from('workspace_members')
          .update({ last_active_at: new Date().toISOString() })
          .eq('workspace_id', currentWorkspaceId)
          .eq('user_id', user.id),
      ]);
      recentPRDs = (prdsResult.data ?? []).map((p) => ({ id: p.id, title: p.title ?? 'Untitled' }));
    }
  }

  return (
    <AppShell
      workspaces={workspaces}
      currentWorkspaceId={currentWorkspaceId}
      currentUserRole={currentUserRole}
      userName={userName}
      userEmail={userEmail}
      userAvatarUrl={userAvatarUrl}
      recentPRDs={recentPRDs}
    >
      {children}
    </AppShell>
  );
}
