'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { setCurrentWorkspaceCookie } from '@/lib/workspace/current-workspace-cookie';

export async function setCurrentWorkspace(
  workspaceId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  const admin = createAdminClient();

  // Verify membership with the service-role client. The authenticated user is already
  // verified above, but workspace_members RLS can otherwise make valid memberships
  // look missing and cause the switcher to close without actually changing state.
  const { data: member, error } = await admin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (error || !member) {
    return { success: false, error: 'You do not have access to this workspace.' };
  }

  const cookieStore = await cookies();
  setCurrentWorkspaceCookie(cookieStore, workspaceId);

  revalidatePath('/');
  return { success: true };
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
