'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';
import { logInfo } from '@/lib/logging/system-log';
import { logActivity } from '@/lib/logging/activity-log';

async function requireSuperAdmin() {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: profile } = await admin
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
  const user = await requireSuperAdmin();
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

  const { data: announcement, error: announcementError } = await admin
    .from('announcements')
    .insert({
      title: data.title,
      message: data.message,
      target: data.target,
      target_value: data.targetValue ?? null,
      recipient_count: userIds.length,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (announcementError || !announcement) {
    return { error: announcementError?.message ?? 'Failed to create announcement' };
  }

  // Create notifications for each user, linked to the announcement entity.
  const notifications = userIds.map((userId) => ({
    recipient_id: userId,
    type: 'integration_event' as const,
    title: data.title,
    body: data.message,
    resource_type: 'announcement',
    resource_id: announcement.id,
  }));

  const { error } = await admin.from('notifications').insert(notifications);

  if (error) return { error: error.message };

  const { data: auditWorkspace } = await admin
    .from('workspaces')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (auditWorkspace?.id) {
    await logActivity({
      workspaceId: auditWorkspace.id,
      actorId: user.id,
      type: 'announcement_created',
      resourceType: 'announcement',
      resourceId: announcement.id,
      metadata: {
        title: data.title,
        target: data.target,
        target_value: data.targetValue ?? null,
        recipient_count: userIds.length,
      },
    });
  }

  logInfo(
    'admin.announcement',
    `announcement_created: "${data.title}" to ${userIds.length} users`,
    { title: data.title, target: data.target, recipient_count: userIds.length },
    user.id,
  );

  revalidatePath('/admin/announcements');
  return { success: true, count: userIds.length };
}

export async function getAnnouncementHistory() {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data } = await admin
    .from('announcements')
    .select('id, title, message, target, target_value, recipient_count, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(500);

  return (data ?? []) as {
    id: string;
    title: string;
    message: string;
    target: 'all' | 'role' | 'user';
    target_value: string | null;
    recipient_count: number;
    created_at: string;
  }[];
}

export async function deleteAnnouncement(announcementId: string) {
  const user = await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: announcement, error: fetchError } = await admin
    .from('announcements')
    .select('id, title, recipient_count')
    .eq('id', announcementId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !announcement) {
    return { error: fetchError?.message ?? 'Announcement not found' };
  }

  const deletedAt = new Date().toISOString();
  const { error: updateError } = await admin
    .from('announcements')
    .update({ deleted_at: deletedAt, deleted_by: user.id })
    .eq('id', announcementId)
    .is('deleted_at', null);

  if (updateError) return { error: updateError.message };

  const { error: notificationError } = await admin
    .from('notifications')
    .delete()
    .eq('resource_type', 'announcement')
    .eq('resource_id', announcementId);

  if (notificationError) return { error: notificationError.message };

  const { data: auditWorkspace } = await admin
    .from('workspaces')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (auditWorkspace?.id) {
    await logActivity({
      workspaceId: auditWorkspace.id,
      actorId: user.id,
      type: 'announcement_deleted',
      resourceType: 'announcement',
      resourceId: announcementId,
      metadata: {
        title: announcement.title,
        recipient_count: announcement.recipient_count,
      },
    });
  }

  logInfo(
    'admin.announcement',
    `announcement_deleted: "${announcement.title}"`,
    { announcement_id: announcementId, title: announcement.title },
    user.id,
  );

  revalidatePath('/admin/announcements');
  return { success: true };
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
