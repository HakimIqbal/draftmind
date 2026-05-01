import { createClient } from '@/lib/supabase/server';

export interface DashboardStats {
  activePRDs: number;
  queueCount: number;
  avgHealth: number;
  cycleTimeDays: number;
}

export async function getDashboardStats(workspaceId: string): Promise<DashboardStats> {
  const supabase = await createClient();

  const { count: activePRDs } = await supabase
    .from('prds')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .is('archived_at', null);

  const { count: queueCount } = await supabase
    .from('prds')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .in('status', ['in_review', 'reviewed'])
    .is('archived_at', null);

  const { data: healthData } = await supabase
    .from('prds')
    .select('health_score')
    .eq('workspace_id', workspaceId)
    .is('archived_at', null)
    .not('health_score', 'is', null);

  const avgHealth =
    healthData && healthData.length > 0
      ? Math.round(
          healthData.reduce((sum, p) => sum + (p.health_score ?? 0), 0) / healthData.length,
        )
      : 0;

  // Calculate average cycle time: days from PRD creation to status 'final'
  const { data: completedPRDs } = await supabase
    .from('prds')
    .select('created_at, updated_at')
    .eq('workspace_id', workspaceId)
    .eq('status', 'final')
    .is('archived_at', null)
    .order('updated_at', { ascending: false })
    .limit(20);

  let cycleTimeDays = 0;
  if (completedPRDs && completedPRDs.length > 0) {
    const totalDays = completedPRDs.reduce((sum, p) => {
      const created = new Date(p.created_at).getTime();
      const completed = new Date(p.updated_at).getTime();
      return sum + (completed - created) / (1000 * 60 * 60 * 24);
    }, 0);
    cycleTimeDays = Math.round(totalDays / completedPRDs.length);
  }

  return {
    activePRDs: activePRDs ?? 0,
    queueCount: queueCount ?? 0,
    avgHealth,
    cycleTimeDays,
  };
}

export interface ContinueWorkingPRD {
  id: string;
  title: string;
  project_tag: string | null;
  status: string;
  health_score: number | null;
  updated_at: string;
  owner: { full_name: string | null; avatar_color_seed: string | null } | null;
}

export async function getContinueWorkingPRDs(
  workspaceId: string,
  userId: string,
  limit: number = 4,
): Promise<ContinueWorkingPRD[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('prds')
    .select(
      'id, title, project_tag, status, health_score, updated_at, owner:profiles!prds_owner_id_fkey(full_name, avatar_color_seed)',
    )
    .eq('workspace_id', workspaceId)
    .is('archived_at', null)
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
  actor: { full_name: string | null; avatar_color_seed: string | null } | null;
}

export async function getActivityFeed(
  workspaceId: string,
  limit: number = 6,
): Promise<ActivityFeedItem[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('activity_log')
    .select(
      'id, type, resource_type, resource_id, metadata, created_at, actor:profiles!activity_log_actor_id_fkey(full_name, avatar_color_seed)',
    )
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    ...row,
    actor: Array.isArray(row.actor) ? (row.actor[0] ?? null) : row.actor,
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
  const supabase = await createClient();

  const { data } = await supabase
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
