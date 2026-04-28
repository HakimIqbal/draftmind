import { createClient } from '@/lib/supabase/server';

export async function getNotifications(userId: string, workspaceId: string, limit: number = 20) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getUnreadCount(userId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .is('read_at', null);
  return count ?? 0;
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient();
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);
}

export async function markAllAsRead(userId: string) {
  const supabase = await createClient();
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .is('read_at', null);
}
