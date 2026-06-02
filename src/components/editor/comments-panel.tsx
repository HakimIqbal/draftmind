'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Textarea } from '@/components/ui/textarea';
import {
  addComment,
  resolveComment,
  unresolveComment,
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
  onCommentDeleted?: (commentId: string) => void;
  onCommentResolved?: (commentId: string) => void;
  onCommentReopened?: (commentId: string) => void;
  activeCommentId?: string | null;
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
  activeReplyId,
  replyBody,
  onReplyClick,
  onReplyBodyChange,
  onReplySubmit,
  onReplyCancel,
  onResolve,
  onReopen,
  onEdit,
  onDelete,
  onCommentClick,
}: {
  comment: Comment;
  currentUserId: string;
  activeReplyId: string | null;
  replyBody: string;
  onReplyClick: (commentId: string) => void;
  onReplyBodyChange: (v: string) => void;
  onReplySubmit: (parentId: string) => void;
  onReplyCancel: () => void;
  onResolve: (commentId: string) => void;
  onReopen: (commentId: string) => void;
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
                onReplyClick(comment.id);
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
            {comment.resolved_at && (
              <button
                type="button"
                className="font-mono text-[11px] text-ink-tertiary transition-colors hover:text-ink-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onReopen(comment.id);
                }}
              >
                Reopen
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
              activeReplyId={activeReplyId}
              replyBody={replyBody}
              onReplyClick={onReplyClick}
              onReplyBodyChange={onReplyBodyChange}
              onReplySubmit={onReplySubmit}
              onReplyCancel={onReplyCancel}
              onResolve={onResolve}
              onReopen={onReopen}
              onEdit={onEdit}
              onDelete={onDelete}
              onCommentClick={onCommentClick}
            />
          ))}
        </div>
      )}

      {/* Inline reply textarea */}
      {activeReplyId === comment.id && (
        <div className="ml-8 mt-2 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          <p className="font-mono text-[10px] text-ink-tertiary">
            Replying to {comment.author?.full_name ?? 'Unknown'}
          </p>
          <textarea
            autoFocus
            rows={2}
            value={replyBody}
            onChange={(e) => onReplyBodyChange(e.target.value)}
            placeholder="Write a reply..."
            className="w-full resize-none rounded-md border border-subtle bg-bg-surface px-3 py-2 text-sm text-ink-primary placeholder:text-ink-quaternary focus:outline-none focus:ring-1 focus:ring-accent"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onReplySubmit(comment.id);
              }
              if (e.key === 'Escape') onReplyCancel();
            }}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!replyBody.trim()}
              onClick={() => onReplySubmit(comment.id)}
              className="rounded-md bg-[#1a1a1a] px-3 py-1 text-[12px] font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              Reply
            </button>
            <button
              type="button"
              onClick={onReplyCancel}
              className="rounded-md px-3 py-1 text-[12px] text-ink-tertiary transition-colors hover:text-ink-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CommentsPanel({
  prdId,
  currentUserId,
  onCommentClick,
  onCommentDeleted,
  onCommentResolved,
  onCommentReopened,
  activeCommentId,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState<'open' | 'resolved' | 'me'>('open');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  // Realtime subscription — refetch when any comment on this PRD changes
  useRealtimeSubscription({
    channel: `comments-${prdId}`,
    table: 'comments',
    filter: `prd_id=eq.${prdId}`,
    onChange: () => loadCommentsRef.current(),
  });

  // S6: scroll to + highlight comment when editor highlight is clicked or when a new
  // inline comment is added. The realtime subscription can lag, so force a reload
  // on activeCommentId changes before attempting to scroll.
  useEffect(() => {
    if (!activeCommentId) return;
    loadCommentsRef.current();
    const t = setTimeout(() => {
      const el = commentRefs.current[activeCommentId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
    return () => clearTimeout(t);
  }, [activeCommentId]);

  const threads = useMemo(() => buildThreads(comments), [comments]);
  const openCount = useMemo(
    () => comments.filter((c) => !c.resolved_at && !c.parent_id).length,
    [comments],
  );

  // Top-level comment submit
  const handleSubmit = async () => {
    const body = newComment.trim();
    if (!body || submitting) return;
    setSubmitting(true);
    try {
      const result = await addComment(prdId, body, null);
      if (result?.error) {
        setSubmitting(false);
        return;
      }
      setNewComment('');
      setSubmitting(false);
      await loadComments();
    } catch {
      setSubmitting(false);
    }
  };

  // Inline reply handlers
  const handleReplyClick = (commentId: string) => {
    setActiveReplyId((prev) => (prev === commentId ? null : commentId));
    setReplyBody('');
  };

  const handleReplySubmit = async (parentId: string) => {
    const body = replyBody.trim();
    if (!body) return;
    try {
      const result = await addComment(prdId, body, parentId);
      if (result?.error) return;
      setActiveReplyId(null);
      setReplyBody('');
      await loadComments();
    } catch {
      // error handled silently
    }
  };

  const handleReplyCancel = () => {
    setActiveReplyId(null);
    setReplyBody('');
  };

  const handleResolve = async (commentId: string) => {
    await resolveComment(commentId);
    onCommentResolved?.(commentId);
    loadComments();
  };

  const handleEdit = async (commentId: string, body: string) => {
    await editComment(commentId, body);
    loadComments();
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId);
    onCommentDeleted?.(commentId);
    loadComments();
  };

  const handleReopen = async (commentId: string) => {
    await unresolveComment(commentId);
    onCommentReopened?.(commentId);
    loadComments();
  };

  return (
    <div className="flex h-full flex-col" data-testid="comments-sidebar">
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
              <div
                key={thread.id}
                ref={(el) => {
                  commentRefs.current[thread.id] = el;
                }}
                className={`rounded transition-colors ${activeCommentId === thread.id ? 'bg-accent/8 ring-accent/30 ring-1' : ''}`}
              >
                <CommentCard
                  comment={thread}
                  currentUserId={currentUserId}
                  activeReplyId={activeReplyId}
                  replyBody={replyBody}
                  onReplyClick={handleReplyClick}
                  onReplyBodyChange={setReplyBody}
                  onReplySubmit={handleReplySubmit}
                  onReplyCancel={handleReplyCancel}
                  onResolve={handleResolve}
                  onReopen={handleReopen}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCommentClick={onCommentClick}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add top-level comment form */}
      <div className="border-t border-subtle px-4 py-3">
        <Textarea
          rows={2}
          data-testid="comments-new-body"
          placeholder="Add a comment... (⌘+Enter to submit)"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
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
