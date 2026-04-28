'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Chip } from '@/components/ui/chip';
import { Avatar } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  actor_name: string | null;
  action_url: string | null;
  resource_title: string | null;
  is_read: boolean;
  created_at: string;
}

type TabKey = 'all' | 'mentions' | 'reviews';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'mentions', label: 'Mentions' },
  { key: 'reviews', label: 'Reviews' },
];

const VERB_MAP: Record<string, string> = {
  mention: 'mentioned you in',
  review_request: 'requested review on',
  comment: 'commented on',
  status_change: 'changed status of',
  assignment: 'assigned you to',
};

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

interface NotificationsInboxProps {
  userId: string;
  workspaceId: string;
}

export function NotificationsInbox({ userId, workspaceId }: NotificationsInboxProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [tab, setTab] = useState<TabKey>('all');
  const router = useRouter();
  const supabase = createClient();

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setNotifications(data);
  }, [userId, workspaceId, supabase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filtered = useMemo(() => {
    if (tab === 'all') return notifications;
    if (tab === 'mentions') return notifications.filter((n) => n.type === 'mention');
    if (tab === 'reviews') return notifications.filter((n) => n.type === 'review_request');
    return notifications;
  }, [notifications, tab]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function markRead(id: string, actionUrl: string | null) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    if (actionUrl) {
      router.push(actionUrl);
    }
  }

  return (
    <div className="flex max-h-[480px] w-[380px] flex-col bg-bg-elevated">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-subtle px-md py-sm">
        <span className="text-sm font-medium text-ink-primary">
          Notifications{unreadCount > 0 ? ` \u00B7 ${unreadCount} unread` : ''}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-ink-secondary transition-colors hover:text-ink-primary"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-xs border-b border-subtle px-md">
        {TABS.map((t) => (
          <Chip key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </Chip>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-md py-xl text-center text-sm text-ink-tertiary">All caught up!</p>
        ) : (
          <div>
            {filtered.map((n) => {
              const verb = VERB_MAP[n.type] ?? n.type;
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id, n.action_url)}
                  className="flex w-full items-start gap-sm px-md py-sm text-left transition-colors hover:bg-bg-surface"
                >
                  {/* Unread dot */}
                  <span className="mt-1.5 flex h-1.5 w-1.5 shrink-0">
                    {!n.is_read && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                  </span>

                  <Avatar name={n.actor_name ?? 'Unknown'} size="sm" />

                  <span className="min-w-0 flex-1 text-sm text-ink-secondary">
                    <span className="font-medium text-ink-primary">
                      {n.actor_name ?? 'Someone'}
                    </span>{' '}
                    {verb}{' '}
                    {n.resource_title && (
                      <span className="font-medium text-ink-primary">{n.resource_title}</span>
                    )}
                    <span className="block font-mono text-[11px] text-ink-tertiary">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-subtle px-md py-sm">
        <Link
          href="/settings/notifications"
          className="text-xs text-ink-secondary transition-colors hover:text-ink-primary"
        >
          Notification preferences
        </Link>
      </div>
    </div>
  );
}
