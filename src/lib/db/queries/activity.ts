import { createClient } from '@/lib/supabase/server';

export async function getActivityLog(workspaceId: string, limit: number = 50, offset: number = 0) {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from('activity_log')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  const items = (data ?? []).filter(
    (activity) => (activity as { metadata?: { probe?: boolean } }).metadata?.probe !== true,
  );
  return { items, total: count ?? 0 };
}
