'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  tiptapToPRD,
  countTiptapWords,
  tiptapToTemplate,
  isTemplatePRD,
  mergeTemplateContent,
  type TiptapDoc,
} from '@/lib/prd/tiptap-content';
import { computeHealthScore } from '@/lib/prd/health-score';
import { PRDDocumentSchema } from '@/lib/prd/schema';
import { logError } from '@/lib/logging/system-log';
import { logActivity } from '@/lib/logging/activity-log';
import { sendNotification } from '@/lib/notifications/send';

export async function duplicatePRD(prdId: string) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return { error: 'No workspace found' };

  const supabase = await createClient();

  const { data: original } = await supabase
    .from('prds')
    .select('*')
    .eq('id', prdId)
    .eq('workspace_id', workspace.id)
    .single();

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
      hidden_sections: original.hidden_sections ?? [],
      current_version: 1,
    })
    .select('id')
    .single();

  if (error) {
    logError('prd.duplicate', error.message, { prdId }, user.id);
    return { error: 'Failed to duplicate PRD' };
  }

  await logActivity({
    workspaceId: workspace.id,
    actorId: user.id,
    type: 'prd_duplicated',
    resourceType: 'prd',
    resourceId: duplicate.id,
    metadata: { original_prd_id: prdId, title: original.title },
  });

  // Notify original PRD owner (if not self)
  if (original.owner_id && original.owner_id !== user.id) {
    const { data: duplicator } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    const duplicatorName = duplicator?.full_name ?? 'Someone';
    sendNotification({
      recipientId: original.owner_id,
      workspaceId: workspace.id,
      type: 'prd_duplicated',
      title: 'Your PRD was duplicated',
      body: `${duplicatorName} duplicated "${original.title}"`,
      resourceType: 'prd',
      resourceId: duplicate.id,
      actionUrl: `/prds/${duplicate.id}`,
    });
  }

  revalidatePath('/prds');
  return { id: duplicate.id };
}

export async function deletePRD(prdId: string) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return { error: 'No workspace found' };

  const supabase = await createClient();

  // Clean up notifications referencing this PRD before delete
  const admin = createAdminClient();
  await admin.from('notifications').delete().eq('resource_id', prdId);

  const { error } = await supabase
    .from('prds')
    .delete()
    .eq('id', prdId)
    .eq('workspace_id', workspace.id);

  if (error) {
    logError('prd.delete', error.message, { prdId }, user.id);
    return { error: 'Failed to delete PRD' };
  }

  await logActivity({
    workspaceId: workspace.id,
    actorId: user.id,
    type: 'prd_deleted',
    resourceType: 'prd',
    resourceId: prdId,
  });

  revalidatePath('/prds');
  revalidatePath('/dashboard');
  redirect('/prds');
}

export async function restoreVersion(prdId: string, versionId: string) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return { error: 'No workspace found' };

  const admin = createAdminClient();

  const { data: version, error: versionError } = await admin
    .from('prd_versions')
    .select('content, version_number')
    .eq('id', versionId)
    .eq('prd_id', prdId)
    .single();

  if (!version || versionError) return { error: 'Version not found' };

  const { data: prd, error: prdError } = await admin
    .from('prds')
    .select('current_version, content, tiptap_content')
    .eq('id', prdId)
    .single();

  if (!prd || prdError) return { error: 'PRD not found' };

  const nextVersion = (prd.current_version ?? 0) + 1;

  const { error: snapshotError } = await admin.from('prd_versions').insert({
    prd_id: prdId,
    version_number: nextVersion,
    content: prd.tiptap_content ?? prd.content,
    change_summary: 'Restored from earlier version',
    source: 'restore',
    created_by: user.id,
  });

  if (snapshotError) {
    logError('prd.restore-version', snapshotError.message, { prdId, versionId }, user.id);
    return { error: 'Failed to snapshot current version before restore' };
  }

  const restoredTiptap = version.content as unknown as TiptapDoc;
  let structuredContent: unknown = prd.content;
  let healthScore: number | null = null;
  let healthBreakdown: unknown = null;
  let wordCount: number | null = null;

  if (isTemplatePRD(prd.content as Record<string, unknown>)) {
    try {
      const templateDocument = tiptapToTemplate(restoredTiptap);
      structuredContent = mergeTemplateContent(
        prd.content as Record<string, unknown>,
        templateDocument,
      );
      wordCount = countTiptapWords(version.content as unknown as Record<string, unknown>);
    } catch (err) {
      logError(
        'prd.restore-version.template',
        err instanceof Error ? err.message : 'Failed to restore template PRD content',
        { prdId, versionId },
        user.id,
      );
    }
  } else {
    const parsedExisting = PRDDocumentSchema.safeParse(prd.content);
    if (parsedExisting.success) {
      try {
        const plainPRD = JSON.parse(JSON.stringify(parsedExisting.data));
        const updatedDocument = tiptapToPRD(restoredTiptap, plainPRD);
        const health = computeHealthScore(updatedDocument);
        structuredContent = updatedDocument;
        healthScore = health.score;
        healthBreakdown = health.breakdown;
        wordCount = countTiptapWords(version.content as unknown as Record<string, unknown>);
      } catch (err) {
        logError(
          'prd.restore-version.health',
          err instanceof Error ? err.message : 'Failed to recompute health score on restore',
          { prdId, versionId },
          user.id,
        );
      }
    } else {
      logError(
        'prd.restore-version',
        'Stored PRD content failed schema validation',
        { prdId },
        user.id,
      );
    }
  }

  const updatePayload: Record<string, unknown> = {
    tiptap_content: version.content,
    content: structuredContent,
    current_version: nextVersion,
    updated_at: new Date().toISOString(),
  };

  if (healthScore !== null) updatePayload.health_score = healthScore;
  if (healthBreakdown !== null) updatePayload.health_breakdown = healthBreakdown;
  if (wordCount !== null) {
    updatePayload.word_count = wordCount;
    updatePayload.read_time_minutes = Math.max(1, Math.round(wordCount / 200));
  }

  const { error: updateError } = await admin.from('prds').update(updatePayload).eq('id', prdId);

  if (updateError) {
    logError('prd.restore-version', updateError.message, { prdId, versionId }, user.id);
    return { error: 'Failed to restore version' };
  }

  await logActivity({
    workspaceId: workspace.id,
    actorId: user.id,
    type: 'prd_version_restored',
    resourceType: 'prd',
    resourceId: prdId,
    metadata: { restored_version: version.version_number, new_version: nextVersion },
  });

  revalidatePath(`/prds/${prdId}`);
  revalidatePath(`/prds/${prdId}/version-history`);
  return { success: true, version: nextVersion };
}

export async function renameVersion(prdId: string, versionId: string, name: string) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  const admin = createAdminClient();

  const { error } = await admin
    .from('prd_versions')
    .update({ change_summary: name })
    .eq('id', versionId)
    .eq('prd_id', prdId);

  if (error) return { error: 'Failed to rename version' };

  if (workspace) {
    await logActivity({
      workspaceId: workspace.id,
      actorId: user.id,
      type: 'prd_edited',
      resourceType: 'prd',
      resourceId: prdId,
      metadata: { action: 'rename_version', version_id: versionId, new_name: name },
    });
  }

  return { success: true };
}

export async function updatePRDStatus(prdId: string, status: string) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return { error: 'No workspace found' };

  const supabase = await createClient();

  // Check permission: only workspace admin or PRD owner can change status
  const { data: prd } = await supabase
    .from('prds')
    .select('owner_id, title')
    .eq('id', prdId)
    .eq('workspace_id', workspace.id)
    .single();

  if (!prd) return { error: 'PRD not found' };

  const isOwner = prd.owner_id === user.id;
  const isAdmin = workspace.currentRole === 'admin';

  if (!isOwner && !isAdmin) {
    return { error: 'Only the PRD owner or workspace admin can change status' };
  }

  const { error } = await supabase
    .from('prds')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', prdId)
    .eq('workspace_id', workspace.id);

  if (error) return { error: 'Failed to update status' };

  await logActivity({
    workspaceId: workspace.id,
    actorId: user.id,
    type: 'prd_status_changed',
    resourceType: 'prd',
    resourceId: prdId,
    metadata: { new_status: status },
  });

  const reviewActivityType =
    status === 'in_review'
      ? 'review_requested'
      : status === 'reviewed' || status === 'approved'
        ? 'review_approved'
        : null;

  if (reviewActivityType) {
    await logActivity({
      workspaceId: workspace.id,
      actorId: user.id,
      type: reviewActivityType,
      resourceType: 'prd',
      resourceId: prdId,
      metadata: { status, title: prd.title },
    });
  }

  // Notify all workspace members about status change (except changer, skip draft)
  if (status !== 'draft') {
    const statusBodyMap: Record<string, string> = {
      in_review: `moved "${prd.title}" to In Review`,
      reviewed: `marked "${prd.title}" as Reviewed`,
      refined: `marked "${prd.title}" as Refined`,
      approved: `approved "${prd.title}" 🎉`,
      final: `marked "${prd.title}" as Final 🎉`,
    };
    const bodyTemplate = statusBodyMap[status];
    if (bodyTemplate) {
      const [{ data: changerProfile }, { data: members }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
        supabase.from('workspace_members').select('user_id').eq('workspace_id', workspace.id),
      ]);
      const changerName = changerProfile?.full_name ?? 'Someone';
      const recipients = (members ?? []).filter((m) => m.user_id !== user.id);
      Promise.all(
        recipients.map((m) =>
          sendNotification({
            recipientId: m.user_id,
            workspaceId: workspace.id,
            type: 'status_changed',
            title: prd.title,
            body: `${changerName} ${bodyTemplate}`,
            resourceType: 'prd',
            resourceId: prdId,
            actionUrl: `/prds/${prdId}`,
          }),
        ),
      );
    }
  }

  revalidatePath(`/prds/${prdId}`);
  revalidatePath('/prds');
  return { success: true };
}

export async function togglePRDPin(prdId: string, isPinned: boolean) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return { error: 'No workspace found' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('prds')
    .update({ is_pinned: isPinned })
    .eq('id', prdId)
    .eq('workspace_id', workspace.id);

  if (error) return { error: 'Failed to update pin' };

  await logActivity({
    workspaceId: workspace.id,
    actorId: user.id,
    type: 'prd_pinned',
    resourceType: 'prd',
    resourceId: prdId,
    metadata: { is_pinned: isPinned },
  });

  revalidatePath(`/prds/${prdId}`);
  revalidatePath('/prds');
  return { success: true };
}

export async function updateHiddenSections(prdId: string, hiddenSections: string[]) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return { error: 'No workspace found' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('prds')
    .update({ hidden_sections: hiddenSections })
    .eq('id', prdId)
    .eq('workspace_id', workspace.id);

  if (error) {
    logError('prd.hidden_sections', error.message, { prdId }, user.id);
    return { error: 'Failed to update section visibility' };
  }

  await logActivity({
    workspaceId: workspace.id,
    actorId: user.id,
    type: 'prd_edited',
    resourceType: 'prd',
    resourceId: prdId,
    metadata: { action: 'update_hidden_sections', hidden_sections: hiddenSections },
  });

  revalidatePath(`/prds/${prdId}`);
  return { success: true };
}
