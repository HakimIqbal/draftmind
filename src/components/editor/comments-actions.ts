'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser, requireWorkspaceRole } from '@/lib/auth/permissions';
import { logError } from '@/lib/logging/system-log';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { logActivity } from '@/lib/logging/activity-log';
import { sendNotification } from '@/lib/notifications/send';

export interface SelectionRange {
  from: number;
  to: number;
  quotedText: string;
}

// Roles allowed to interact with comments (viewer = read-only)
const COMMENTER_ROLES = ['admin', 'editor', 'commenter'] as const;

async function getWorkspaceIdFromComment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  commentId: string,
): Promise<string | null> {
  const { data: comment } = await supabase
    .from('comments')
    .select('prd_id')
    .eq('id', commentId)
    .single();
  if (!comment) return null;
  const { data: prd } = await supabase
    .from('prds')
    .select('workspace_id')
    .eq('id', comment.prd_id)
    .single();
  return prd?.workspace_id ?? null;
}

export async function addComment(
  prdId: string,
  body: string,
  parentId: string | null,
  selectionRange?: SelectionRange,
) {
  const supabase = await createClient();

  // Fetch workspaceId to verify role before insert
  const { data: prd } = await supabase.from('prds').select('workspace_id').eq('id', prdId).single();
  if (!prd) return { error: 'PRD not found' };
  const { user } = await requireWorkspaceRole(prd.workspace_id, [...COMMENTER_ROLES]);

  const { data, error } = await supabase
    .from('comments')
    .insert({
      prd_id: prdId,
      author_id: user.id,
      parent_id: parentId,
      body,
      selection_range: selectionRange ?? null,
    })
    .select('id')
    .single();

  if (error) {
    logError('comments.add', error.message, { prdId }, user.id);
    return { error: 'Failed to add comment' };
  }

  const ws = await getCurrentWorkspace(user.id);
  if (ws) {
    logActivity({
      workspaceId: ws.id,
      actorId: user.id,
      type: 'comment_added',
      resourceType: 'prd',
      resourceId: prdId,
    });

    // Get commenter name for notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    const commenterName = profile?.full_name ?? 'Someone';

    // Get PRD title for context
    const { data: prd } = await supabase.from('prds').select('title').eq('id', prdId).single();
    const prdTitle = prd?.title ?? 'a PRD';

    // Notify PRD owner about new comment (not reply, not self-comment)
    if (!parentId) {
      const { data: prdOwner } = await supabase
        .from('prds')
        .select('owner_id')
        .eq('id', prdId)
        .single();

      if (prdOwner && prdOwner.owner_id !== user.id) {
        sendNotification({
          recipientId: prdOwner.owner_id,
          workspaceId: ws.id,
          type: 'comment_added',
          title: 'New comment on your PRD',
          body: `${commenterName} commented on "${prdTitle}"`,
          resourceType: 'prd',
          resourceId: prdId,
          actionUrl: `/prds/${prdId}`,
        });
      }
    }

    // Notify parent comment author on reply
    if (parentId) {
      const { data: parent } = await supabase
        .from('comments')
        .select('author_id')
        .eq('id', parentId)
        .single();

      if (parent && parent.author_id !== user.id) {
        sendNotification({
          recipientId: parent.author_id,
          workspaceId: ws.id,
          type: 'comment_reply',
          title: 'New reply to your comment',
          body: `${commenterName} replied to your comment on "${prdTitle}"`,
          resourceType: 'prd',
          resourceId: prdId,
          actionUrl: `/prds/${prdId}`,
        });
      }
    }

    // Notify @mentioned users
    const mentionRegex = /@(\S+)/g;
    const mentions = [...body.matchAll(mentionRegex)].map((m) => m[1]);
    if (mentions.length > 0) {
      // Look up mentioned users by name
      const { data: mentionedUsers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('full_name', mentions);

      if (mentionedUsers) {
        for (const mentioned of mentionedUsers) {
          if (mentioned.id === user.id) continue;
          sendNotification({
            recipientId: mentioned.id,
            workspaceId: ws.id,
            type: 'mention',
            title: 'You were mentioned',
            body: `${commenterName} mentioned you in a comment on "${prdTitle}"`,
            resourceType: 'prd',
            resourceId: prdId,
            actionUrl: `/prds/${prdId}`,
          });
        }
      }
    }
  }

  return { id: data.id };
}

export async function resolveComment(commentId: string) {
  const supabase = await createClient();
  const workspaceId = await getWorkspaceIdFromComment(supabase, commentId);
  if (!workspaceId) return { error: 'Comment not found' };
  const { user } = await requireWorkspaceRole(workspaceId, [...COMMENTER_ROLES]);

  const { error } = await supabase
    .from('comments')
    .update({ resolved_at: new Date().toISOString() })
    .eq('id', commentId);

  if (error) {
    logError('comments.resolve', error.message, { commentId });
    return { error: 'Failed to resolve comment' };
  }

  const ws = await getCurrentWorkspace(user.id);
  if (ws)
    logActivity({
      workspaceId: ws.id,
      actorId: user.id,
      type: 'comment_resolved',
      resourceType: 'comment',
      resourceId: commentId,
    });

  return { success: true };
}

export async function unresolveComment(commentId: string) {
  const supabase = await createClient();
  const workspaceId = await getWorkspaceIdFromComment(supabase, commentId);
  if (!workspaceId) return { error: 'Comment not found' };
  const { user } = await requireWorkspaceRole(workspaceId, [...COMMENTER_ROLES]);

  const { error } = await supabase
    .from('comments')
    .update({ resolved_at: null })
    .eq('id', commentId);

  if (error) {
    logError('comments.unresolve', error.message, { commentId }, user.id);
    return { error: 'Failed to reopen comment' };
  }

  return { success: true };
}

export async function editComment(commentId: string, body: string) {
  const supabase = await createClient();
  const workspaceId = await getWorkspaceIdFromComment(supabase, commentId);
  if (!workspaceId) return { error: 'Comment not found' };
  const { user } = await requireWorkspaceRole(workspaceId, [...COMMENTER_ROLES]);

  // Verify ownership
  const { data: comment } = await supabase
    .from('comments')
    .select('author_id')
    .eq('id', commentId)
    .single();

  if (!comment || comment.author_id !== user.id) {
    return { error: 'You can only edit your own comments' };
  }

  const { error } = await supabase.from('comments').update({ body }).eq('id', commentId);

  if (error) {
    logError('comments.edit', error.message, { commentId }, user.id);
    return { error: 'Failed to edit comment' };
  }

  const ws = await getCurrentWorkspace(user.id);
  if (ws)
    logActivity({
      workspaceId: ws.id,
      actorId: user.id,
      type: 'comment_edited',
      resourceType: 'comment',
      resourceId: commentId,
    });

  return { success: true };
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  const workspaceId = await getWorkspaceIdFromComment(supabase, commentId);
  if (!workspaceId) return { error: 'Comment not found' };
  const { user } = await requireWorkspaceRole(workspaceId, [...COMMENTER_ROLES]);

  // Verify ownership
  const { data: comment } = await supabase
    .from('comments')
    .select('author_id')
    .eq('id', commentId)
    .single();

  if (!comment || comment.author_id !== user.id) {
    return { error: 'You can only delete your own comments' };
  }

  // Delete replies first, then the comment
  await supabase.from('comments').delete().eq('parent_id', commentId);
  const { error } = await supabase.from('comments').delete().eq('id', commentId);

  if (error) {
    logError('comments.delete', error.message, { commentId }, user.id);
    return { error: 'Failed to delete comment' };
  }

  const ws = await getCurrentWorkspace(user.id);
  if (ws)
    logActivity({
      workspaceId: ws.id,
      actorId: user.id,
      type: 'comment_deleted',
      resourceType: 'comment',
      resourceId: commentId,
    });

  return { success: true };
}

export async function fetchComments(prdId: string, filter: 'open' | 'resolved' | 'me') {
  const user = await requireUser();
  const supabase = await createClient();

  let query = supabase
    .from('comments')
    .select('*, author:profiles!comments_author_id_fkey(full_name, avatar_color_seed, avatar_url)')
    .eq('prd_id', prdId)
    .limit(200)
    .order('created_at', { ascending: true });

  if (filter === 'open') query = query.is('resolved_at', null);
  if (filter === 'resolved') query = query.not('resolved_at', 'is', null);

  const { data } = await query;
  let result = data ?? [];

  if (filter === 'me') {
    result = result.filter((c: { author_id: string }) => c.author_id === user.id);
  }

  return result;
}
