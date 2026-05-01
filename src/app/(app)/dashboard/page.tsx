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
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect('/dashboard');

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
    <HomeFeed
      userName={fullName}
      workspaceId={wsId}
      stats={stats}
      continueWorking={continueWorking}
      activityFeed={activity}
      needsAttention={attention}
      templates={templates}
    />
  );
}
