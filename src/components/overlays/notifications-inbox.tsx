'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Inbox, Megaphone, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '@/app/(app)/notifications/actions';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

const ANNOUNCEMENT_TYPES = ['integration_event'];

function isAnnouncement(type: string) {
  return ANNOUNCEMENT_TYPES.includes(type);
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return '1d ago';
  return `${diffDays}d ago`;
}

const TYPE_LABELS: Record<string, string> = {
  mention: 'Mention',
  review_request: 'Review',
  approval_needed: 'Approval',
  comment_reply: 'Reply',
  comment_added: 'Comment',
  ai_suggestion_ready: 'AI',
  workspace_invite: 'Invite',
  prd_duplicated: 'Duplicate',
  member_joined: 'Team',
  member_removed: 'Workspace',
  invitation_declined: 'Invite',
  integration_event: 'Announcement',
};

export function NotificationsInbox() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tab, setTab] = useState<'inbox' | 'announcements'>('inbox');
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch {
      // Server action may be stale after HMR
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const inboxItems = useMemo(
    () => notifications.filter((n) => !isAnnouncement(n.type)),
    [notifications],
  );
  const announcementItems = useMemo(
    () => notifications.filter((n) => isAnnouncement(n.type)),
    [notifications],
  );
  const currentItems = tab === 'inbox' ? inboxItems : announcementItems;
  const inboxUnread = useMemo(() => inboxItems.filter((n) => !n.read_at).length, [inboxItems]);
  const announcementUnread = useMemo(
    () => announcementItems.filter((n) => !n.read_at).length,
    [announcementItems],
  );
  const totalUnread = inboxUnread + announcementUnread;

  async function handleMarkAllRead() {
    await markAllNotificationsRead(tab);
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => {
        const match = tab === 'inbox' ? !isAnnouncement(n.type) : isAnnouncement(n.type);
        return match && !n.read_at ? { ...n, read_at: now } : n;
      }),
    );
  }

  async function handleMarkRead(id: string, actionUrl: string | null) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
    );
    if (actionUrl) router.push(actionUrl);
  }

  async function handleDelete(id: string) {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="flex max-h-[480px] w-[400px] flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#f0f0f0] px-4 py-3">
        <span className="text-[14px] font-semibold text-[#1a1a1a]">
          Notifications{totalUnread > 0 ? ` · ${totalUnread}` : ''}
        </span>
        {(tab === 'inbox' ? inboxUnread : announcementUnread) > 0 && (
          <button onClick={handleMarkAllRead} className="text-[12px] text-accent hover:underline">
            Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#f0f0f0]">
        <button
          onClick={() => setTab('inbox')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium transition-colors',
            tab === 'inbox'
              ? 'border-b-2 border-[#1a1a1a] text-[#1a1a1a]'
              : 'text-[#999] hover:text-[#555]',
          )}
        >
          <Inbox size={13} />
          Inbox
          {inboxUnread > 0 && (
            <span className="rounded-full bg-accent px-1.5 py-px text-[10px] font-bold text-white">
              {inboxUnread}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('announcements')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium transition-colors',
            tab === 'announcements'
              ? 'border-b-2 border-[#1a1a1a] text-[#1a1a1a]'
              : 'text-[#999] hover:text-[#555]',
          )}
        >
          <Megaphone size={13} />
          Announcements
          {announcementUnread > 0 && (
            <span className="rounded-full bg-accent px-1.5 py-px text-[10px] font-bold text-white">
              {announcementUnread}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {currentItems.length === 0 ? (
          <div className="px-4 py-12 text-center">
            {tab === 'inbox' ? (
              <>
                <Inbox size={20} className="mx-auto text-[#ddd]" />
                <p className="mt-2 text-[13px] text-[#aaa]">No notifications yet</p>
              </>
            ) : (
              <>
                <Megaphone size={20} className="mx-auto text-[#ddd]" />
                <p className="mt-2 text-[13px] text-[#aaa]">No announcements</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#f5f5f5]">
            {currentItems.map((n) => (
              <div
                key={n.id}
                className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#fafaf9]"
              >
                <button
                  onClick={() => handleMarkRead(n.id, n.action_url)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <span className="mt-1.5 flex h-2 w-2 shrink-0">
                    {!n.read_at && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-[#1a1a1a]">{n.title}</p>
                      {tab === 'inbox' && (
                        <span className="shrink-0 rounded bg-[#f5f5f4] px-1.5 py-px text-[9px] font-semibold uppercase text-[#999]">
                          {TYPE_LABELS[n.type] ?? n.type}
                        </span>
                      )}
                    </div>
                    {n.body && <p className="mt-0.5 text-[12px] text-[#888]">{n.body}</p>}
                    <p className="mt-1 text-[11px] text-[#bbb]">
                      {formatRelativeTime(n.created_at)}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="mt-1 shrink-0 rounded p-1 text-[#ddd] opacity-0 transition-all hover:bg-[#f0f0f0] hover:text-[#999] group-hover:opacity-100"
                  title="Delete"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
    </div>
  );
}
