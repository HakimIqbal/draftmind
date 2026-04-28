'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Textarea } from '@/components/ui/textarea';

interface Comment {
  id: string;
  prd_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  resolved_at: string | null;
  created_at: string;
  author: {
    full_name: string;
    avatar_color_seed: string | null;
  } | null;
  replies?: Comment[];
}

export interface CommentsPanelProps {
  prdId: string;
  currentUserId: string;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function buildThreads(comments: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];

  for (const c of comments) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of map.values()) {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies!.push(c);
    } else {
      roots.push(c);
    }
  }

  return roots;
}

function CommentCard({
  comment,
  onReply,
  onResolve,
}: {
  comment: Comment;
  onReply: (parentId: string) => void;
  onResolve: (commentId: string) => void;
}) {
  const authorName = comment.author?.full_name ?? 'Unknown';
  const seed = comment.author?.avatar_color_seed ?? undefined;

  return (
    <div className="py-2">
      <div className="flex items-start gap-2">
        <Avatar name={authorName} size="sm" seed={seed} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-ink-primary">{authorName}</span>
            <span className="shrink-0 font-mono text-[11px] text-ink-tertiary">
              {relativeTime(comment.created_at)}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-ink-primary">{comment.body}</p>
          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              className="font-mono text-[11px] text-ink-tertiary transition-colors hover:text-ink-primary"
              onClick={() => onReply(comment.id)}
            >
              Reply
            </button>
            {!comment.resolved_at && (
              <button
                type="button"
                className="font-mono text-[11px] text-ink-tertiary transition-colors hover:text-ink-primary"
                onClick={() => onResolve(comment.id)}
              >
                Resolve
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 mt-1 border-l border-subtle pl-3">
          {comment.replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} onReply={onReply} onResolve={onResolve} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentsPanel({ prdId, currentUserId }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState<'open' | 'resolved' | 'me'>('open');
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const fetchComments = useCallback(async () => {
    const query = supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(full_name, avatar_color_seed)')
      .eq('prd_id', prdId)
      .order('created_at', { ascending: true });

    if (filter === 'open') query.is('resolved_at', null);
    if (filter === 'resolved') query.not('resolved_at', 'is', null);

    const { data } = await query;
    let result = (data as Comment[]) ?? [];

    if (filter === 'me') {
      result = result.filter((c) => c.author_id === currentUserId);
    }

    setComments(result);
  }, [prdId, filter, currentUserId, supabase]);

  // Keep a ref to fetchComments so the realtime handler always calls the latest version
  // without needing to re-subscribe when the filter changes.
  const fetchCommentsRef = useRef(fetchComments);
  useEffect(() => {
    fetchCommentsRef.current = fetchComments;
  }, [fetchComments]);

  // Fetch comments on mount and when filter changes
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Realtime subscription — depends only on prdId so the channel stays stable across filter changes
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${prdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `prd_id=eq.${prdId}`,
        },
        () => {
          fetchCommentsRef.current();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [prdId, supabase]);

  const threads = useMemo(() => buildThreads(comments), [comments]);
  const openCount = useMemo(
    () => comments.filter((c) => !c.resolved_at && !c.parent_id).length,
    [comments],
  );

  const handleSubmit = async () => {
    const body = newComment.trim();
    if (!body || submitting) return;

    setSubmitting(true);
    await supabase.from('comments').insert({
      prd_id: prdId,
      author_id: currentUserId,
      parent_id: replyTo,
      body,
    });
    setNewComment('');
    setReplyTo(null);
    setSubmitting(false);
  };

  const handleResolve = async (commentId: string) => {
    await supabase
      .from('comments')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', commentId);
  };

  const handleReply = (parentId: string) => {
    setReplyTo(parentId);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-4 pb-2 pt-3">
        <span className="font-mono text-[11px] text-ink-tertiary">
          Comments &middot; {openCount} open
        </span>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1 border-b border-subtle px-4 pb-2">
        <Chip active={filter === 'open'} onClick={() => setFilter('open')}>
          Open
        </Chip>
        <Chip active={filter === 'resolved'} onClick={() => setFilter('resolved')}>
          Resolved
        </Chip>
        <Chip active={filter === 'me'} onClick={() => setFilter('me')}>
          @Me
        </Chip>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-4">
        {threads.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <span className="text-sm text-ink-tertiary">No comments yet.</span>
          </div>
        ) : (
          <div className="divide-y divide-subtle">
            {threads.map((thread) => (
              <CommentCard
                key={thread.id}
                comment={thread}
                onReply={handleReply}
                onResolve={handleResolve}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add comment form */}
      <div className="border-t border-subtle px-4 py-3">
        {replyTo && (
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-[11px] text-ink-tertiary">Replying to thread</span>
            <button
              type="button"
              className="font-mono text-[11px] text-ink-tertiary hover:text-ink-primary"
              onClick={() => setReplyTo(null)}
            >
              Cancel
            </button>
          </div>
        )}
        <Textarea
          rows={2}
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="text-sm"
        />
        <div className="mt-2 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={!newComment.trim() || submitting}
            onClick={handleSubmit}
          >
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
