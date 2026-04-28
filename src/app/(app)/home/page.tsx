import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import {
  getDashboardStats,
  getContinueWorkingPRDs,
  getActivityFeed,
  getNeedsAttention,
} from '@/lib/db/queries/dashboard';
import { HomeFeed } from '@/components/dashboard/home-feed';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect('/onboarding/step-3');

  const wsId = workspace.id as string;
  const fullName =
    (user.user_metadata as Record<string, string> | undefined)?.full_name ?? user.email ?? 'there';

  const [stats, continueWorking, activity, attention] = await Promise.all([
    getDashboardStats(wsId),
    getContinueWorkingPRDs(wsId, user.id, 4),
    getActivityFeed(wsId, 6),
    getNeedsAttention(wsId, user.id),
  ]);

  return (
    <HomeFeed
      userName={fullName}
      workspaceId={wsId}
      stats={stats}
      continueWorking={continueWorking}
      activityFeed={activity}
      needsAttention={attention}
    />
  );
}
