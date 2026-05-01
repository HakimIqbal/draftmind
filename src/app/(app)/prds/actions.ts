'use server';

import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function duplicatePRD(prdId: string) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return { error: 'No workspace found' };

  const supabase = await createClient();

  const { data: original } = await supabase
    .from('prds')
    .select('title, content, project_tag')
    .eq('id', prdId)
    .single();

  if (!original) return { error: 'PRD not found' };

  const { data: newPrd, error } = await supabase
    .from('prds')
    .insert({
      title: `${original.title} (Copy)`,
      content: original.content,
      project_tag: original.project_tag,
      status: 'draft',
      workspace_id: workspace.id,
      owner_id: user.id,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/prds');
  return { success: true, id: newPrd.id };
}

export async function archivePRD(prdId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from('prds')
    .update({ archived_at: new Date().toISOString(), status: 'archived' })
    .eq('id', prdId);

  if (error) return { error: error.message };

  revalidatePath('/prds');
  return { success: true };
}

export async function deletePRD(prdId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from('prds').delete().eq('id', prdId);

  if (error) return { error: error.message };

  revalidatePath('/prds');
  return { success: true };
}
