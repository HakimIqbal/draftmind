'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logWarn } from '@/lib/logging/system-log';

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) throw new Error('Not authorized');
  return user;
}

export async function publishAnnouncement(data: {
  title: string;
  message: string;
  target: 'all' | 'role' | 'user';
  targetValue?: string; // role name or user id
}) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  // Get target user IDs
  let userIds: string[] = [];

  if (data.target === 'all') {
    const { data: users } = await admin.from('profiles').select('id').eq('is_super_admin', false);
    userIds = (users ?? []).map((u) => u.id);
  } else if (data.target === 'role') {
    const { data: users } = await admin
      .from('profiles')
      .select('id')
      .eq('role_self_reported', data.targetValue ?? '')
      .eq('is_super_admin', false);
    userIds = (users ?? []).map((u) => u.id);
  } else if (data.target === 'user') {
    if (data.targetValue) userIds = [data.targetValue];
  }

  if (userIds.length === 0) {
    return { error: 'No users found for this target' };
  }

  // Create notifications for each user
  const notifications = userIds.map((userId) => ({
    recipient_id: userId,
    type: 'integration_event' as const,
    title: data.title,
    body: data.message,
  }));

  const { error } = await admin.from('notifications').insert(notifications);

  if (error) return { error: error.message };

  logWarn(
    'admin.announcement',
    `announcement_published: "${data.title}" to ${userIds.length} users`,
    { title: data.title, target: data.target, recipient_count: userIds.length },
  );

  revalidatePath('/admin/announcements');
  return { success: true, count: userIds.length };
}

export async function getAnnouncementHistory() {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: notifs } = await admin
    .from('notifications')
    .select('title, body, created_at')
    .eq('type', 'integration_event')
    .order('created_at', { ascending: false })
    .limit(500);

  if (!notifs) return [];

  // Group by title+body within 1 minute window
  const groups: Record<
    string,
    { title: string; body: string | null; created_at: string; recipient_count: number }
  > = {};
  for (const n of notifs) {
    const minute = n.created_at.slice(0, 16);
    const key = `${n.title}|${minute}`;
    if (groups[key]) {
      groups[key].recipient_count++;
    } else {
      groups[key] = { title: n.title, body: n.body, created_at: n.created_at, recipient_count: 1 };
    }
  }

  return Object.values(groups);
}

export async function getUsers() {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data } = await admin
    .from('profiles')
    .select('id, full_name, email, role_self_reported')
    .eq('is_super_admin', false)
    .order('full_name');

  return (data ?? []) as {
    id: string;
    full_name: string | null;
    email: string;
    role_self_reported: string | null;
  }[];
}
