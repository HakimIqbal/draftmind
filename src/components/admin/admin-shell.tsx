'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  BarChart3,
  LayoutTemplate,
  Megaphone,
  Settings,
  Activity,
  Sparkles,
  LogOut,
  Terminal,
  Shield,
  Clock,
  Ticket,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { logLogout } from '@/app/(app)/actions';
import { getAdminOpenTicketCount } from '@/app/(admin)/admin/tickets/actions';
import { Avatar } from '@/components/ui/avatar';
import { ProfileModal } from '@/components/settings/profile-modal';
import { useUserStore } from '@/stores/user-store';
import { PresenceHeartbeat } from '@/components/presence/presence-heartbeat';

const NAV_GROUPS = [
  {
    label: 'Dashboard',
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/workspaces', label: 'Workspaces', icon: Building2 },
      { href: '/admin/prds', label: 'PRDs', icon: FileText },
      { href: '/admin/ai-runs', label: 'AI Runs', icon: Sparkles },
      { href: '/admin/tickets', label: 'Tickets', icon: Ticket },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/templates', label: 'Templates', icon: LayoutTemplate },
      { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/providers', label: 'AI Providers', icon: Sparkles },
      { href: '/admin/activity', label: 'Activity Log', icon: Activity },
      { href: '/admin/system-logs', label: 'System Logs', icon: Terminal },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

interface AdminShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  userAvatarUrl?: string;
  openTicketCount?: number;
}

export function AdminShell({
  children,
  userName,
  userEmail,
  userAvatarUrl,
  openTicketCount = 0,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [popupOpen, setPopupOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0, width: 240 });
  const [sessionStart] = useState(() => new Date());
  const [timeAgo, setTimeAgo] = useState('just now');
  const [liveTicketCount, setLiveTicketCount] = useState(openTicketCount);
  const channelRef = useRef(`admin-badge-${crypto.randomUUID()}`);

  const storeName = useUserStore((s) => s.name);
  const storeAvatarUrl = useUserStore((s) => s.avatarUrl);
  const displayName = storeName || userName;
  const displayAvatar = storeAvatarUrl !== null ? storeAvatarUrl : (userAvatarUrl ?? null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Session time tracker
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - sessionStart.getTime()) / 60000);
      if (diff < 1) setTimeAgo('just now');
      else if (diff < 60) setTimeAgo(`${diff}m ago`);
      else setTimeAgo(`${Math.floor(diff / 60)}h ${diff % 60}m ago`);
    }, 60000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  // Realtime subscription — keeps sidebar badge count live without page reload
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(channelRef.current)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, async () => {
        try {
          const count = await getAdminOpenTicketCount();
          setLiveTicketCount(count);
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[AdminShell] badge refresh failed:', err);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const positionPopup = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPopupPos({ top: rect.top, left: rect.left, width: rect.width });
  }, []);

  function openProfileModal() {
    setProfileOpen(true);
    setPopupOpen(false);
  }

  // Keep admin account menu in a portal like the regular user profile menu.
  useEffect(() => {
    if (!popupOpen) return;
    positionPopup();

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (dropdownRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setPopupOpen(false);
    }

    window.addEventListener('resize', positionPopup);
    window.addEventListener('scroll', positionPopup, true);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('resize', positionPopup);
      window.removeEventListener('scroll', positionPopup, true);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [popupOpen, positionPopup]);

  async function handleLogout() {
    await logLogout().catch(() => {});
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <PresenceHeartbeat />
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="flex w-[260px] shrink-0 flex-col border-r border-[#e5e5e3] bg-[#f8f8f7]">
          {/* Brand */}
          <div className="flex items-center gap-3 border-b border-[#e5e5e3] px-6 py-5">
            <Image
              src="/logo/logo.jpg"
              width={28}
              height={28}
              alt="DraftMind"
              className="rounded-lg"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-[#1a1a1a]">DraftMind</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[#999]">Admin</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 pt-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-5">
                <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-[#aaa]">
                  {group.label}
                </p>
                <ul className="space-y-[2px]">
                  {group.items.map((item) => {
                    const isActive =
                      'exact' in item && item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href);
                    const showBadge = item.href === '/admin/tickets' && liveTicketCount > 0;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium transition-all',
                            isActive
                              ? 'bg-white text-[#1a1a1a] shadow-sm'
                              : 'text-[#666] hover:bg-white/60 hover:text-[#1a1a1a]',
                          )}
                        >
                          <item.icon
                            size={16}
                            className={cn('shrink-0', isActive ? 'text-accent' : 'text-[#999]')}
                          />
                          {item.label}
                          {showBadge && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[#E8733A] text-[11px] font-medium text-white">
                              {liveTicketCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Bottom - Avatar with portal menu */}
          <div className="border-t border-[#e5e5e3] px-3 py-3">
            {/* Trigger */}
            <button
              ref={triggerRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={popupOpen}
              onClick={() => {
                if (!popupOpen) positionPopup();
                setPopupOpen((open) => !open);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/60"
            >
              <Avatar name={displayName} size="sm" avatarUrl={displayAvatar} />
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[12px] font-medium text-[#1a1a1a]">{displayName}</p>
                <p className="truncate text-[10px] text-[#999]">{userEmail}</p>
              </div>
              <ChevronDown
                size={13}
                className={`shrink-0 text-[#bbb] transition-transform ${popupOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {popupOpen &&
            createPortal(
              <div
                ref={dropdownRef}
                className="fixed z-[9999] overflow-hidden rounded-xl border border-[#eee] bg-white shadow-lg"
                style={{
                  top: popupPos.top - 8,
                  left: popupPos.left,
                  width: popupPos.width,
                  transform: 'translateY(-100%)',
                }}
                role="menu"
              >
                {/* Section 1 - Profile summary with chevron trigger */}
                <div className="flex items-center gap-3 bg-[#f8f8f7] px-4 py-3">
                  <Avatar name={displayName} size="lg" avatarUrl={displayAvatar} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[13px] font-semibold text-[#1a1a1a]">
                        {displayName}
                      </p>
                      <span className="bg-accent/10 flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-accent">
                        <Shield size={9} />
                        Admin
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-[#aaa]">{userEmail}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Open admin profile"
                    onClick={openProfileModal}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#ccc] transition-colors hover:bg-white hover:text-[#999]"
                  >
                    <ChevronRight size={14} className="shrink-0" />
                  </button>
                </div>

                {/* Section 2 - Session info */}
                <div className="border-t border-[#f0f0f0] px-4 py-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#aaa]">
                    <Clock size={11} />
                    Session started: {timeAgo}
                  </div>
                </div>

                {/* Section 3 - Log out */}
                <div className="border-t border-[#f0f0f0] px-3 py-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="hover:bg-accent/8 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-medium text-accent transition-colors"
                  >
                    <LogOut size={13} />
                    Log out
                  </button>
                </div>
              </div>,
              document.body,
            )}
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-[1100px] px-8 py-8">{children}</div>
          </main>
        </div>

        <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
      </div>
    </>
  );
}
