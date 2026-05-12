'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/permissions';

export async function fetchActivityLog() {
  // Guard: only super admins can access activity log
  const user = await requireUser();
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    throw new Error('Not authorized');
  }

  const { data: activities } = await admin
    .from('activity_log')
    .select('id, type, actor_id, workspace_id, resource_type, resource_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const actorIds = [...new Set((activities ?? []).map((a) => a.actor_id).filter(Boolean))];
  const { data: actors } = await admin
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .in('id', actorIds);
  const actorMap = Object.fromEntries((actors ?? []).map((a) => [a.id, a]));

  const wsIds = [...new Set((activities ?? []).map((a) => a.workspace_id).filter(Boolean))];
  const { data: workspaces } = await admin.from('workspaces').select('id, name').in('id', wsIds);
  const wsMap = Object.fromEntries((workspaces ?? []).map((w) => [w.id, w]));

  return {
    activities: activities ?? [],
    actorMap,
    wsMap,
  };
}
