'use server';

import { requireUser } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getWorkspaceSettings() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!membership) return null;

  const { data: ws } = await supabase
    .from('workspaces')
    .select('id, name, slug, industry, team_size')
    .eq('id', membership.workspace_id)
    .single();

  return ws as {
    id: string;
    name: string;
    slug: string;
    industry: string | null;
    team_size: string | null;
  } | null;
}

export async function updateWorkspaceName(workspaceId: string, name: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from('workspaces')
    .update({ name: name.trim() })
    .eq('id', workspaceId);

  if (error) return { error: error.message };

  revalidatePath('/workspace/settings');
  return { success: true };
}
