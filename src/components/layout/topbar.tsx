'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Menu, Plus, Search } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { NotificationsInbox } from '@/components/overlays/notifications-inbox';
import { getUnreadCount } from '@/app/(app)/notifications/actions';
import { createClient } from '@/lib/supabase/client';
import { useCommandPaletteStore } from '@/stores/command-palette-store';

interface TopbarProps {
  hasWorkspace?: boolean;
  onToggleSidebar?: () => void;
}

export function Topbar({ hasWorkspace = false, onToggleSidebar }: TopbarProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [mobileNotificationsOpen, setMobileNotificationsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { setOpen } = useCommandPaletteStore();
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

  useEffect(() => {
    setMobileNotificationsOpen(false);
  }, [pathname]);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[#f0f0ee] bg-white px-3 md:px-6">
      {/* Left: hamburger (mobile) */}
      <div className="flex shrink-0 items-center">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#666] transition-colors hover:bg-[#f5f5f4] hover:text-[#1a1a1a] md:hidden"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        )}
      </div>

      {/* Center: search bar (desktop) — click opens command palette */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-[360px] cursor-pointer items-center gap-2.5 rounded-lg border border-[#eee] bg-[#fafafa] px-4 text-[12px] text-[#aaa] transition-colors hover:border-[#ddd] hover:bg-[#f5f5f4] md:flex lg:w-[420px]"
      >
        <Search size={14} className="shrink-0 text-[#bbb]" />
        <span className="flex-1 text-left">{searchLabel}</span>
        <kbd className="flex items-center gap-1 rounded-md border border-[#ddd] bg-white px-2 py-1 font-mono text-[11px] font-medium text-[#999] shadow-sm">
          <span className="text-[13px]">⌘</span>K
        </kbd>
      </button>

      {/* Mobile: search icon — opens command palette */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#666] transition-colors hover:bg-[#f5f5f4] hover:text-[#1a1a1a] md:hidden"
        aria-label="Search"
      >
        <Search size={17} />
      </button>

      {/* Right: actions */}
      <div className="flex shrink-0 items-center justify-end gap-2.5 md:gap-2">
        <button
          type="button"
          onClick={() => setMobileNotificationsOpen(true)}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#999] transition-colors hover:bg-[#f5f5f4] hover:text-[#555] md:hidden"
          aria-label="Notifications"
          aria-expanded={mobileNotificationsOpen}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white ring-2 ring-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <Popover
          onOpenChange={(open) => {
            if (!open) fetchUnread();
          }}
        >
          <PopoverTrigger asChild>
            <button
              className="relative hidden h-9 w-9 items-center justify-center rounded-lg text-[#999] transition-colors hover:bg-[#f5f5f4] hover:text-[#555] md:flex"
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

        {mobileNotificationsOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
            <button
              type="button"
              className="absolute inset-0 bg-black/30"
              onClick={() => {
                setMobileNotificationsOpen(false);
                fetchUnread();
              }}
              aria-label="Close notifications"
            />
            <div className="fixed inset-x-0 bottom-0 max-h-[85dvh] overflow-hidden rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl">
              <NotificationsInbox
                onClose={() => {
                  setMobileNotificationsOpen(false);
                  fetchUnread();
                }}
                className="h-[min(85dvh,620px)] max-h-[85dvh] w-full rounded-t-2xl"
              />
            </div>
          </div>
        )}

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
