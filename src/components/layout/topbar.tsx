'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell, Plus, Search } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { NotificationsInbox } from '@/components/overlays/notifications-inbox';
import { getUnreadCount } from '@/app/(app)/notifications/actions';
import { createClient } from '@/lib/supabase/client';

export function Topbar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchUnread = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Server action may be stale after HMR
    }
  }, []);

  // Get userId + setup polling + focus listener
  useEffect(() => {
    // Get current user ID for realtime filter
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    window.addEventListener('focus', fetchUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchUnread);
    };
  }, [fetchUnread]);

  // Realtime subscription for notifications
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        () => fetchUnread(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchUnread]);

  return (
    <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-[#f0f0ee] bg-white px-6">
      <div />

      <div className="flex h-9 w-[360px] items-center gap-2.5 rounded-lg border border-[#eee] bg-[#fafafa] px-4 text-[12px] text-[#aaa]">
        <Search size={14} className="shrink-0 text-[#bbb]" />
        <span className="flex-1 text-left">Search PRDs...</span>
        <kbd className="flex items-center gap-1 rounded-md border border-[#ddd] bg-white px-2 py-1 font-mono text-[11px] font-medium text-[#999] shadow-sm">
          <span className="text-[13px]">⌘</span>K
        </kbd>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Popover
          onOpenChange={(open) => {
            if (!open) fetchUnread();
          }}
        >
          <PopoverTrigger asChild>
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[#999] transition-colors hover:bg-[#f5f5f4] hover:text-[#555]"
              aria-label="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="overflow-hidden rounded-xl border-[#eee] p-0 shadow-xl"
          >
            <NotificationsInbox />
          </PopoverContent>
        </Popover>

        <Link
          href="/prds/new"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-3.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
        >
          <Plus size={14} />
          New PRD
        </Link>
      </div>
    </header>
  );
}
