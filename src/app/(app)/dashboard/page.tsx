import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createClient } from '@/lib/supabase/server';
import {
  getDashboardStats,
  getContinueWorkingPRDs,
  getActivityFeed,
  getNeedsAttention,
} from '@/lib/db/queries/dashboard';
import { HomeFeed } from '@/components/dashboard/home-feed';
import { DashboardPoller } from './dashboard-poller';
import { CreateWorkspaceForm } from './create-workspace-form';

export default async function HomePage() {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);

  if (!workspace) {
    // User has no workspace — show create/join page instead of redirect loop
    const fullName =
      (user.user_metadata as Record<string, string> | undefined)?.full_name ??
      user.email ??
      'there';
    const firstName = fullName.split(' ')[0];

    return (
      <div className="mx-auto max-w-md px-8 py-24 text-center">
        <div className="bg-accent/10 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">Welcome, {firstName}</h1>
        <p className="mt-2 text-[14px] text-[#888]">
          You are not a member of any workspace yet. Create a new workspace or wait for an
          invitation from your team.
        </p>
        <CreateWorkspaceForm />
      </div>
    );
  }

  const wsId = workspace.id as string;
  const fullName =
    (user.user_metadata as Record<string, string> | undefined)?.full_name ?? user.email ?? 'there';

  const supabase = await createClient();

  const [stats, continueWorking, activity, attention, templatesResult] = await Promise.all([
    getDashboardStats(wsId),
    getContinueWorkingPRDs(wsId, user.id, 4),
    getActivityFeed(wsId, 6),
    getNeedsAttention(wsId, user.id),
    supabase
      .from('prd_templates')
      .select('id, name, description, category')
      .eq('is_built_in', true)
      .order('use_count', { ascending: false })
      .limit(4),
  ]);

  const templates = (templatesResult.data ?? []).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    description: (t.description as string) ?? '',
    category: (t.category as string) ?? '',
  }));

  return (
    <>
      <DashboardPoller />
      <HomeFeed
        userName={fullName}
        workspaceId={wsId}
        stats={stats}
        continueWorking={continueWorking}
        activityFeed={activity}
        needsAttention={attention}
        templates={templates}
      />
    </>
  );
}
