'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createClient } from '@/lib/supabase/server';

export async function duplicatePRD(prdId: string) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return { error: 'No workspace found' };

  const supabase = await createClient();

  const { data: original } = await supabase.from('prds').select('*').eq('id', prdId).single();

  if (!original) return { error: 'PRD not found' };

  const { data: duplicate, error } = await supabase
    .from('prds')
    .insert({
      workspace_id: workspace.id,
      owner_id: user.id,
      title: `${original.title} (copy)`,
      brief: original.brief,
      project_tag: original.project_tag,
      status: 'draft',
      content: original.content,
      tiptap_content: original.tiptap_content,
      health_score: original.health_score,
      health_breakdown: original.health_breakdown,
      word_count: original.word_count,
      read_time_minutes: original.read_time_minutes,
      current_version: 1,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/prds');
  return { id: duplicate.id };
}

export async function archivePRD(prdId: string) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return { error: 'No workspace found' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('prds')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', prdId)
    .eq('workspace_id', workspace.id);

  if (error) return { error: error.message };

  revalidatePath('/prds');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deletePRD(prdId: string) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return { error: 'No workspace found' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('prds')
    .delete()
    .eq('id', prdId)
    .eq('workspace_id', workspace.id);

  if (error) return { error: error.message };

  revalidatePath('/prds');
  revalidatePath('/dashboard');
  redirect('/prds');
}

export async function restoreVersion(prdId: string, versionId: string) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return { error: 'No workspace found' };

  const supabase = await createClient();

  // Get the version content
  const { data: version } = await supabase
    .from('prd_versions')
    .select('content, version_number')
    .eq('id', versionId)
    .eq('prd_id', prdId)
    .single();

  if (!version) return { error: 'Version not found' };

  // Get current PRD
  const { data: prd } = await supabase
    .from('prds')
    .select('current_version, content')
    .eq('id', prdId)
    .single();

  if (!prd) return { error: 'PRD not found' };

  const nextVersion = prd.current_version + 1;

  // Save current state as a version before restoring
  await supabase.from('prd_versions').insert({
    prd_id: prdId,
    version_number: nextVersion,
    content: prd.content,
    change_summary: `Restored to v${version.version_number}`,
    source: 'restore',
    created_by: user.id,
  });

  // Update PRD with the restored content
  const { error } = await supabase
    .from('prds')
    .update({
      content: version.content,
      current_version: nextVersion,
      updated_at: new Date().toISOString(),
    })
    .eq('id', prdId);

  if (error) return { error: error.message };

  revalidatePath(`/prds/${prdId}`);
  revalidatePath(`/prds/${prdId}/version-history`);
  return { success: true, version: nextVersion };
}

export async function updatePRDStatus(prdId: string, status: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from('prds')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', prdId);

  if (error) return { error: error.message };

  revalidatePath(`/prds/${prdId}`);
  revalidatePath('/prds');
  return { success: true };
}

export async function togglePRDPin(prdId: string, isPinned: boolean) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from('prds').update({ is_pinned: isPinned }).eq('id', prdId);

  if (error) return { error: error.message };

  revalidatePath(`/prds/${prdId}`);
  revalidatePath('/prds');
  return { success: true };
}
