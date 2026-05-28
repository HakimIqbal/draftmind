'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Menu, Plus, Search } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { NotificationsInbox } from '@/components/overlays/notifications-inbox';
import { getUnreadCount } from '@/app/(app)/notifications/actions';
import { createClient } from '@/lib/supabase/client';

interface TopbarProps {
  hasWorkspace?: boolean;
  onToggleSidebar?: () => void;
}

export function Topbar({ hasWorkspace = false, onToggleSidebar }: TopbarProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isTicketsPage = pathname === '/tickets' || pathname.startsWith('/tickets/');
  const searchLabel = isTicketsPage
    ? 'Search tickets...'
    : hasWorkspace
      ? 'Search PRDs...'
      : 'Search...';

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

  // Focus mobile search input when opened
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileSearchRef.current?.focus(), 50);
    }
  }, [mobileSearchOpen]);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[#f0f0ee] bg-white px-3 md:px-6">
      {/* Left: hamburger (mobile) — hidden when search is open */}
      <div className="flex shrink-0 items-center">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#666] transition-colors hover:bg-[#f5f5f4] hover:text-[#1a1a1a] md:hidden ${mobileSearchOpen ? 'hidden' : ''}`}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        )}
      </div>

      {/* Center: search bar (desktop) */}
      <div className="hidden h-9 w-[360px] items-center gap-2.5 rounded-lg border border-[#eee] bg-[#fafafa] px-4 text-[12px] text-[#aaa] md:flex lg:w-[420px]">
        <Search size={14} className="shrink-0 text-[#bbb]" />
        <span className="flex-1 text-left">{searchLabel}</span>
        <kbd className="flex items-center gap-1 rounded-md border border-[#ddd] bg-white px-2 py-1 font-mono text-[11px] font-medium text-[#999] shadow-sm">
          <span className="text-[13px]">⌘</span>K
        </kbd>
      </div>

      {/* Mobile: inline expandable search */}
      {mobileSearchOpen ? (
        <div className="flex h-9 flex-1 items-center gap-2 md:hidden">
          <div className="flex h-9 flex-1 items-center gap-2.5 rounded-lg border border-[#eee] bg-[#fafafa] px-3 text-[13px] text-[#aaa]">
            <Search size={15} className="shrink-0 text-[#bbb]" />
            <input
              ref={mobileSearchRef}
              type="text"
              placeholder={searchLabel}
              className="min-w-0 flex-1 bg-transparent text-[#1a1a1a] outline-none placeholder:text-[#aaa]"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            className="flex h-9 shrink-0 items-center justify-center rounded-lg px-2 text-[13px] font-medium text-[#666] hover:bg-[#f5f5f4]"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#666] transition-colors hover:bg-[#f5f5f4] hover:text-[#1a1a1a] md:hidden"
          aria-label="Search"
        >
          <Search size={17} />
        </button>
      )}

      {/* Right: actions — hidden when search is open on mobile */}
      <div
        className={`flex shrink-0 items-center justify-end gap-2.5 md:gap-2 ${mobileSearchOpen ? 'hidden md:flex' : ''}`}
      >
        <Popover
          onOpenChange={(open) => {
            if (!open) fetchUnread();
          }}
        >
          <PopoverTrigger asChild>
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#999] transition-colors hover:bg-[#f5f5f4] hover:text-[#555]"
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

        {hasWorkspace ? (
          <Link
            href="/prds/new"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-[#1a1a1a] px-2.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90 sm:gap-1.5 sm:px-3.5"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">New PRD</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => router.replace('/dashboard')}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-[#1a1a1a] px-2.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90 sm:gap-1.5 sm:px-3.5"
            title="Create or join a workspace before creating a PRD."
          >
            <Plus size={15} />
            <span className="hidden sm:inline">New PRD</span>
          </button>
        )}
      </div>
    </header>
  );
}
