'use server';

import { requireUser } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';

export async function getNotifications() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, body, action_url, read_at, created_at')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (data ?? []) as {
    id: string;
    type: string;
    title: string;
    body: string | null;
    action_url: string | null;
    read_at: string | null;
    created_at: string;
  }[];
}

export async function getUnreadCount() {
  const user = await requireUser();
  const supabase = await createClient();

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .is('read_at', null);

  return count ?? 0;
}

export async function markNotificationRead(notificationId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('recipient_id', user.id);

  return { success: true };
}

export async function markAllNotificationsRead(type?: 'inbox' | 'announcements') {
  const user = await requireUser();
  const supabase = await createClient();

  let query = supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .is('read_at', null);

  if (type === 'inbox') {
    query = query.not('type', 'in', '("integration_event","ticket_update")');
  } else if (type === 'announcements') {
    query = query.in('type', ['integration_event', 'ticket_update']);
  }

  await query;
  return { success: true };
}

export async function deleteNotification(notificationId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('recipient_id', user.id);

  return { success: true };
}
