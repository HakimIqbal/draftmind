'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { setCurrentWorkspaceCookie } from '@/lib/workspace/current-workspace-cookie';

export async function setCurrentWorkspace(workspaceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Verify membership
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (!member) return;

  const cookieStore = await cookies();
  setCurrentWorkspaceCookie(cookieStore, workspaceId);

  revalidatePath('/');
}

export async function logLogout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (membership) {
    await admin.from('activity_log').insert({
      workspace_id: membership.workspace_id,
      actor_id: user.id,
      type: 'logout',
      resource_type: 'user',
      resource_id: user.id,
      metadata: { timestamp: new Date().toISOString() },
    });
  }
}
