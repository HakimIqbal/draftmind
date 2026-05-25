import { createAdminClient } from '@/lib/supabase/admin';

export interface DashboardStats {
  activePRDs: number;
  queueCount: number;
  avgHealth: number;
  cycleTimeDays: number;
}

export async function getDashboardStats(workspaceId: string): Promise<DashboardStats> {
  const admin = createAdminClient();

  // Single query — compute all stats in JS instead of 4 separate DB round trips
  const { data: allPRDs } = await admin
    .from('prds')
    .select('status, health_score, created_at, updated_at')
    .eq('workspace_id', workspaceId);

  if (!allPRDs || allPRDs.length === 0) {
    return { activePRDs: 0, queueCount: 0, avgHealth: 0, cycleTimeDays: 0 };
  }

  const activePRDs = allPRDs.length;
  const queueCount = allPRDs.filter(
    (p) => p.status === 'in_review' || p.status === 'reviewed',
  ).length;

  const withHealth = allPRDs.filter((p) => p.health_score != null);
  const avgHealth =
    withHealth.length > 0
      ? Math.round(
          withHealth.reduce((sum, p) => sum + (p.health_score ?? 0), 0) / withHealth.length,
        )
      : 0;

  const completedStatuses = new Set(['approved', 'final', 'shipped']);
  const completed = allPRDs.filter((p) => completedStatuses.has(p.status));
  let cycleTimeDays = 0;
  if (completed.length > 0) {
    const totalDays = completed.reduce((sum, p) => {
      return (
        sum + (new Date(p.updated_at).getTime() - new Date(p.created_at).getTime()) / 86_400_000
      );
    }, 0);
    cycleTimeDays = Math.max(1, Math.round(totalDays / completed.length));
  }

  return { activePRDs, queueCount, avgHealth, cycleTimeDays };
}

export interface ContinueWorkingPRD {
  id: string;
  title: string;
  project_tag: string | null;
  status: string;
  health_score: number | null;
  updated_at: string;
  owner: {
    full_name: string | null;
    avatar_color_seed: string | null;
    avatar_url: string | null;
  } | null;
}

export async function getContinueWorkingPRDs(
  workspaceId: string,
  userId: string,
  limit: number = 4,
): Promise<ContinueWorkingPRD[]> {
  const admin = createAdminClient();

  const { data } = await admin
    .from('prds')
    .select(
      'id, title, project_tag, status, health_score, updated_at, owner:profiles!prds_owner_id_fkey(full_name, avatar_color_seed, avatar_url)',
    )
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    ...row,
    owner: Array.isArray(row.owner) ? (row.owner[0] ?? null) : row.owner,
  })) as ContinueWorkingPRD[];
}

export interface ActivityFeedItem {
  id: string;
  type: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor: {
    full_name: string | null;
    avatar_color_seed: string | null;
    avatar_url: string | null;
  } | null;
}

export async function getActivityFeed(
  workspaceId: string,
  limit: number = 6,
): Promise<ActivityFeedItem[]> {
  const admin = createAdminClient();

  const { data } = await admin
    .from('activity_log')
    .select(
      'id, type, resource_type, resource_id, metadata, created_at, actor:profiles!activity_log_actor_id_fkey(full_name, avatar_color_seed, avatar_url, is_super_admin)',
    )
    .eq('workspace_id', workspaceId)
    .not('type', 'in', '(login,logout)')
    .order('created_at', { ascending: false })
    .limit(limit);

  const items = (data ?? []).map((row) => ({
    ...row,
    actor: Array.isArray(row.actor) ? (row.actor[0] ?? null) : row.actor,
  })) as ActivityFeedItem[];

  const prdIds = Array.from(
    new Set(
      items
        .filter((item) => item.resource_type === 'prd' && item.resource_id)
        .map((item) => item.resource_id as string),
    ),
  );

  if (prdIds.length === 0) return items;

  const { data: prds } = await admin.from('prds').select('id, title').in('id', prdIds);
  const titleMap = new Map((prds ?? []).map((prd) => [prd.id, prd.title]));

  return items.map((item) => ({
    ...item,
    metadata: {
      ...item.metadata,
      prd_title:
        item.resource_type === 'prd' && item.resource_id
          ? (titleMap.get(item.resource_id) ?? item.metadata?.prd_title)
          : item.metadata?.prd_title,
    },
  })) as ActivityFeedItem[];
}

export interface NeedsAttentionItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  resource_type: string | null;
  resource_id: string | null;
  action_url: string | null;
  created_at: string;
}

export async function getNeedsAttention(
  workspaceId: string,
  userId: string,
): Promise<NeedsAttentionItem[]> {
  const admin = createAdminClient();

  const { data } = await admin
    .from('notifications')
    .select('id, type, title, body, resource_type, resource_id, action_url, created_at')
    .eq('recipient_id', userId)
    .eq('workspace_id', workspaceId)
    .is('read_at', null)
    .in('type', ['review_request', 'approval_needed', 'mention'])
    .order('created_at', { ascending: false })
    .limit(3);

  return (data ?? []) as NeedsAttentionItem[];
}
