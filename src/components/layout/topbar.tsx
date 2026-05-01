'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell, Plus } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { NotificationsInbox } from '@/components/overlays/notifications-inbox';
import { getUnreadCount } from '@/app/(app)/notifications/actions';

export function Topbar() {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    const count = await getUnreadCount();
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  return (
    <header className="flex h-14 shrink-0 items-center justify-end border-b border-[#f0f0ee] bg-white px-6">
      <div className="flex items-center gap-2">
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
