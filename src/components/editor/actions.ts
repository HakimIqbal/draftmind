'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { logError } from '@/lib/logging/system-log';
import { logActivity } from '@/lib/logging/activity-log';
import {
  countTiptapWords,
  tiptapToPRD,
  tiptapToTemplate,
  isTemplatePRD,
  mergeTemplateContent,
  type TiptapDoc,
} from '@/lib/prd/tiptap-content';
import { computeHealthScore } from '@/lib/prd/health-score';
import { PRDDocumentSchema } from '@/lib/prd/schema';

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

  // Deep clone to ensure we have plain JSON (not a Proxy)
  tiptapContent = JSON.parse(JSON.stringify(tiptapContent));

  // Recalculate word count + read time from the latest content
  const wordCount = countTiptapWords(tiptapContent);
  const readTimeMinutes = Math.max(1, Math.round(wordCount / 200));

  const admin = createAdminClient();

  const { data: existing, error: loadError } = await admin
    .from('prds')
    .select('content')
    .eq('id', prdId)
    .eq('workspace_id', workspace.id)
    .single();

  if (loadError || !existing?.content) {
    logError('editor.save', loadError?.message ?? 'PRD content not found', { prdId }, user.id);
    return { ok: false };
  }

  let healthScore: number | null = null;
  let healthBreakdown: Record<string, number> | null = null;
  let structuredContent = existing.content;

  if (isTemplatePRD(existing.content as Record<string, unknown>)) {
    try {
      const templateDocument = tiptapToTemplate(tiptapContent as unknown as TiptapDoc);
      structuredContent = mergeTemplateContent(
        existing.content as Record<string, unknown>,
        templateDocument,
      );
    } catch (err) {
      logError(
        'editor.save.template',
        err instanceof Error ? err.message : 'Failed to update template PRD content',
        { prdId },
        user.id,
      );
    }
  } else {
    const parsed = PRDDocumentSchema.safeParse(existing.content);
    if (parsed.success) {
      try {
        // Sanitize parsed.data to a plain object — Zod's .default() can produce
        // objects that Next.js RSC treats as client module references, causing
        // "Cannot access level on the server" errors when computeHealthScore
        // iterates over nested properties.
        const plainPRD = JSON.parse(JSON.stringify(parsed.data));
        const updatedDocument = tiptapToPRD(tiptapContent as unknown as TiptapDoc, plainPRD);
        const health = computeHealthScore(updatedDocument);
        structuredContent = updatedDocument;
        healthScore = health.score;
        healthBreakdown = { ...health.breakdown };
      } catch (err) {
        logError(
          'editor.save.health',
          err instanceof Error ? err.message : 'Failed to recompute health score',
          { prdId },
          user.id,
        );
      }
    } else {
      logError(
        'editor.save.health',
        'Stored PRD content failed schema validation',
        { prdId },
        user.id,
      );
    }
  }

  const updatePayload: Record<string, unknown> = {
    content: structuredContent,
    tiptap_content: tiptapContent,
    word_count: wordCount,
    read_time_minutes: readTimeMinutes,
    updated_at: new Date().toISOString(),
    last_edited_by: user.id,
  };

  if (healthScore !== null && healthBreakdown !== null) {
    updatePayload.health_score = healthScore;
    updatePayload.health_breakdown = healthBreakdown;
  }

  const { error } = await admin
    .from('prds')
    .update(updatePayload)
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
