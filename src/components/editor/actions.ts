'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { logError } from '@/lib/logging/system-log';
import { logActivity } from '@/lib/logging/activity-log';
import { countTiptapWords } from '@/lib/prd/tiptap-content';

export async function savePRDContent(
  prdId: string,
  tiptapContent: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) {
    logError('editor.save', 'No workspace found', { prdId });
    return { ok: false };
  }

  // Recalculate word count + read time from the latest content
  const wordCount = countTiptapWords(tiptapContent);
  const readTimeMinutes = Math.max(1, Math.round(wordCount / 200));

  const supabase = await createClient();

  const { error } = await supabase
    .from('prds')
    .update({
      tiptap_content: tiptapContent,
      word_count: wordCount,
      read_time_minutes: readTimeMinutes,
      updated_at: new Date().toISOString(),
      last_edited_by: user.id,
    })
    .eq('id', prdId)
    .eq('workspace_id', workspace.id);

  if (error) {
    logError('editor.save', error.message, { prdId }, user.id);
    return { ok: false };
  }

  logActivity({
    workspaceId: workspace.id,
    actorId: user.id,
    type: 'prd_edited',
    resourceType: 'prd',
    resourceId: prdId,
  });

  return { ok: true };
}
