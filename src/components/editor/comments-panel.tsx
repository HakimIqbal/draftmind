'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Textarea } from '@/components/ui/textarea';
import {
  addComment,
  resolveComment,
  editComment,
  deleteComment,
  fetchComments,
} from '@/components/editor/comments-actions';

// Stabilo colors for comment highlights — soft pastel, professional
const COMMENT_COLORS = [
  'rgba(255, 237, 130, 0.35)', // yellow
  'rgba(166, 227, 161, 0.35)', // green
  'rgba(203, 166, 247, 0.35)', // purple
  'rgba(243, 139, 168, 0.30)', // pink
  'rgba(250, 179, 135, 0.35)', // orange
  'rgba(148, 226, 213, 0.35)', // teal
  'rgba(221, 199, 248, 0.35)', // mauve
  'rgba(255, 198, 174, 0.30)', // peach
] as const;

export function getCommentColor(index: number): string {
  return COMMENT_COLORS[index % COMMENT_COLORS.length]!;
}

interface Comment {
  id: string;
  prd_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  section_key: string | null;
  selection_range: {
    from: number;
    to: number;
    quotedText: string;
  } | null;
  resolved_at: string | null;
  created_at: string;
  author: {
    full_name: string;
    avatar_color_seed: string | null;
    avatar_url: string | null;
  } | null;
  replies?: Comment[];
}

export interface CommentsPanelProps {
  prdId: string;
  currentUserId: string;
  onCommentClick?: (commentId: string, range: { from: number; to: number }) => void;
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
  currentUserId,
  onReply,
  onResolve,
  onEdit,
  onDelete,
  onCommentClick,
}: {
  comment: Comment;
  currentUserId: string;
  onReply: (parentId: string) => void;
  onResolve: (commentId: string) => void;
  onEdit: (commentId: string, body: string) => void;
  onDelete: (commentId: string) => void;
  onCommentClick?: (commentId: string, range: { from: number; to: number }) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);
  const authorName = comment.author?.full_name ?? 'Unknown';
  const seed = comment.author?.avatar_color_seed ?? undefined;
  const hasSelection = !!comment.selection_range;
  const isOwn = comment.author_id === currentUserId;

  return (
    <div
      className={`group relative py-2 ${hasSelection ? 'hover:bg-bg-elevated/50 cursor-pointer rounded transition-colors' : ''}`}
      onClick={() => {
        if (hasSelection && comment.selection_range && onCommentClick) {
          onCommentClick(comment.id, {
            from: comment.selection_range.from,
            to: comment.selection_range.to,
          });
        }
      }}
    >
      <div className="flex items-start gap-2">
        <Avatar
          name={authorName}
          size="sm"
          seed={seed}
          avatarUrl={comment.author?.avatar_url ?? null}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-ink-primary">{authorName}</span>
            <span
              className="shrink-0 font-mono text-[11px] text-ink-tertiary"
              suppressHydrationWarning
            >
              {relativeTime(comment.created_at)}
            </span>
            {/* Section badge */}
            {comment.section_key && (
              <span className="shrink-0 rounded bg-bg-elevated px-1.5 py-0.5 text-[9px] font-medium capitalize text-ink-tertiary">
                {comment.section_key.replace(/_/g, ' ')}
              </span>
            )}
            {/* Edit/delete menu for own comments — always visible */}
            {isOwn && (
              <div className="relative ml-auto">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                  className="flex h-5 w-5 items-center justify-center rounded text-ink-tertiary transition-colors hover:bg-bg-elevated hover:text-ink-primary"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <circle cx="2" cy="6" r="1.2" />
                    <circle cx="6" cy="6" r="1.2" />
                    <circle cx="10" cy="6" r="1.2" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-7 z-20 w-32 rounded-xl border border-subtle bg-bg-elevated py-1 shadow-lg">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(true);
                        setEditText(comment.body);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-ink-secondary transition-colors hover:bg-bg-surface"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(comment.id);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-red-500 transition-colors hover:bg-red-50"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {hasSelection && comment.selection_range && (
            <div className="mt-1 rounded bg-bg-elevated px-2 py-1">
              <p className="line-clamp-2 text-[11px] italic text-ink-tertiary">
                &ldquo;{comment.selection_range.quotedText}&rdquo;
              </p>
            </div>
          )}
          {editing ? (
            <div className="mt-1" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full rounded border border-subtle bg-bg-surface px-2 py-1 text-sm text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent"
                rows={2}
              />
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onEdit(comment.id, editText);
                    setEditing(false);
                  }}
                  className="font-mono text-[11px] text-accent hover:underline"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="font-mono text-[11px] text-ink-tertiary hover:text-ink-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 text-sm text-ink-primary">{comment.body}</p>
          )}
          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              className="font-mono text-[11px] text-ink-tertiary transition-colors hover:text-ink-primary"
              onClick={(e) => {
                e.stopPropagation();
                onReply(comment.id);
              }}
            >
              Reply
            </button>
            {!comment.resolved_at && (
              <button
                type="button"
                className="font-mono text-[11px] text-ink-tertiary transition-colors hover:text-ink-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve(comment.id);
                }}
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
            <CommentCard
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onResolve={onResolve}
              onEdit={onEdit}
              onDelete={onDelete}
              onCommentClick={onCommentClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentsPanel({ prdId, currentUserId, onCommentClick }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState<'open' | 'resolved' | 'me'>('open');
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const data = await fetchComments(prdId, filter);
      setComments(data as Comment[]);
    } catch {
      // Server action may be stale after HMR
    }
  }, [prdId, filter]);

  const loadCommentsRef = useRef(loadComments);
  useEffect(() => {
    loadCommentsRef.current = loadComments;
  }, [loadComments]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Poll for new comments every 5 seconds (replaces realtime subscription)
  useEffect(() => {
    const interval = setInterval(() => {
      loadCommentsRef.current();
    }, 5000);
    return () => clearInterval(interval);
  }, [prdId]);

  const threads = useMemo(() => buildThreads(comments), [comments]);
  const openCount = useMemo(
    () => comments.filter((c) => !c.resolved_at && !c.parent_id).length,
    [comments],
  );

  const handleSubmit = async () => {
    const body = newComment.trim();
    if (!body || submitting) return;

    setSubmitting(true);
    await addComment(prdId, body, replyTo);
    setNewComment('');
    setReplyTo(null);
    setSubmitting(false);
    loadComments();
  };

  const handleResolve = async (commentId: string) => {
    await resolveComment(commentId);
    loadComments();
  };

  const handleReply = (parentId: string) => {
    setReplyTo(parentId);
  };

  const handleEdit = async (commentId: string, body: string) => {
    await editComment(commentId, body);
    loadComments();
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId);
    loadComments();
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
                currentUserId={currentUserId}
                onReply={handleReply}
                onResolve={handleResolve}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCommentClick={onCommentClick}
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
