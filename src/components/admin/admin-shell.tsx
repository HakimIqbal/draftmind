'use client';

import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { logLogout } from '@/app/(app)/actions';

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
}

export function AdminShell({ children, userName, userEmail }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [popupOpen, setPopupOpen] = useState(false);
  const [sessionStart] = useState(() => new Date());
  const [timeAgo, setTimeAgo] = useState('just now');
  const popupRef = useRef<HTMLDivElement>(null);

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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

  // Click outside to close popup
  useEffect(() => {
    if (!popupOpen) return;
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopupOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [popupOpen]);

  async function handleLogout() {
    await logLogout().catch(() => {});
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
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
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom — Avatar with popup */}
        <div className="relative border-t border-[#e5e5e3] px-3 py-3" ref={popupRef}>
          {/* Popup panel */}
          {popupOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border border-[#eee] bg-white shadow-lg">
              {/* Profile */}
              <div className="flex items-center gap-3 border-b border-[#f0f0f0] px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[#1a1a1a]">{userName}</p>
                  <p className="text-[11px] text-[#aaa]">{userEmail}</p>
                </div>
                <span className="bg-accent/10 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-accent">
                  <Shield size={10} />
                  Admin
                </span>
              </div>

              {/* Session info */}
              <div className="border-b border-[#f0f0f0] px-4 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] text-[#aaa]">
                  <Clock size={11} />
                  Session started: {timeAgo}
                </div>
              </div>

              {/* Logout */}
              <div className="px-4 py-2">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-[12px] text-red-500 hover:bg-red-50"
                >
                  <LogOut size={13} />
                  Log out
                </button>
              </div>
            </div>
          )}

          {/* Trigger */}
          <button
            onClick={() => setPopupOpen(!popupOpen)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/60"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-[12px] font-medium text-[#1a1a1a]">{userName}</p>
              <p className="truncate text-[10px] text-[#999]">{userEmail}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1100px] px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
