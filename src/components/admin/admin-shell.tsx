'use client';

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
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';

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

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
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

        {/* Bottom */}
        <div className="border-t border-[#e5e5e3] px-3 py-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-[#1a1a1a]">{userName}</p>
              <p className="truncate text-[10px] text-[#999]">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-[#ccc] transition-colors hover:text-[#666]"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
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
