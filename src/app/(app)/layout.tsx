import { AppShell } from '@/components/layout/app-shell';
import { createClient } from '@/lib/supabase/server';
import { getUserWorkspaces, getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

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
  let openTicketCount = 0;

  const pathname = (await headers()).get('x-pathname') ?? '';

  if (user) {
    workspaces = await getUserWorkspaces(user.id);

    // Guard: user has no workspace membership and is on a workspace-specific route
    if (
      workspaces &&
      workspaces.length === 0 &&
      (pathname === '/workspace' || pathname.startsWith('/workspace/'))
    ) {
      redirect('/dashboard');
    }
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

    const ticketCountPromise = supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['open', 'in_progress']);

    if (currentWorkspaceId) {
      const [ticketResult, prdsResult] = await Promise.all([
        ticketCountPromise,
        supabase
          .from('prds')
          .select('id, title')
          .eq('workspace_id', currentWorkspaceId)
          .eq('owner_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(5),
        supabase
          .from('workspace_members')
          .update({ last_active_at: new Date().toISOString() })
          .eq('workspace_id', currentWorkspaceId)
          .eq('user_id', user.id),
      ]);
      openTicketCount = ticketResult.count ?? 0;
      recentPRDs = (prdsResult.data ?? []).map((p) => ({ id: p.id, title: p.title ?? 'Untitled' }));
    } else {
      const [{ count }, { data: firstMembership }] = await Promise.all([
        ticketCountPromise,
        supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', user.id)
          .limit(1)
          .single(),
      ]);
      openTicketCount = count ?? 0;
      if (firstMembership) {
        void supabase
          .from('workspace_members')
          .update({ last_active_at: new Date().toISOString() })
          .eq('workspace_id', firstMembership.workspace_id)
          .eq('user_id', user.id)
          .then();
      }
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
      openTicketCount={openTicketCount}
      userId={user?.id}
    >
      {children}
    </AppShell>
  );
}
