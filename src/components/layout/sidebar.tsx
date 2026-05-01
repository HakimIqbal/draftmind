'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Home,
  FileText,
  LayoutTemplate,
  Users,
  BarChart3,
  Settings,
  Search,
  PanelLeftClose,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { WorkspaceSwitcher } from './workspace-switcher';
import { createClient } from '@/lib/supabase/client';
import type { WorkspaceListItem } from '@/lib/db/queries/workspace';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/prds', label: 'My PRDs', icon: FileText },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/workspace/members', label: 'Team', icon: Users },
  { href: '/ai-runs', label: 'Analytics', icon: BarChart3 },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  workspaces?: WorkspaceListItem[];
  currentWorkspaceId?: string;
  userName?: string;
  userEmail?: string;
  recentPRDs?: { id: string; title: string }[];
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  workspaces,
  currentWorkspaceId,
  userName,
  userEmail,
  recentPRDs,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (collapsed) return null;

  const initials = (userName ?? 'U')
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
    <aside className="flex h-screen w-[250px] shrink-0 flex-col border-r border-[#f0f0ee] bg-[#f8f8f7]">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image
            src="/logo/logo.jpg"
            width={26}
            height={26}
            alt="DraftMind"
            className="rounded-lg"
          />
          <span className="text-[14px] font-bold text-[#1a1a1a]">DraftMind</span>
        </Link>
        <button
          onClick={onToggleCollapse}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#bbb] transition-colors hover:bg-white hover:text-[#666]"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <Link
          href="/search"
          className="flex h-8 w-full items-center gap-2 rounded-lg bg-white px-3 text-[12px] text-[#aaa] shadow-sm transition-colors hover:text-[#666]"
        >
          <Search size={13} />
          <span className="flex-1">Search...</span>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pt-2">
        <ul className="space-y-[2px]">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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

        {/* Recent PRDs */}
        {recentPRDs && recentPRDs.length > 0 && (
          <div className="mt-6">
            <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-[#aaa]">
              Recent
            </p>
            <ul className="space-y-[2px]">
              {recentPRDs.map((prd) => (
                <li key={prd.id}>
                  <Link
                    href={`/prds/${prd.id}`}
                    className={cn(
                      'flex h-8 items-center gap-2 rounded-lg px-3 text-[12px] transition-colors',
                      pathname === `/prds/${prd.id}`
                        ? 'bg-white text-[#1a1a1a] shadow-sm'
                        : 'text-[#888] hover:bg-white/60 hover:text-[#1a1a1a]',
                    )}
                  >
                    <FileText size={12} className="shrink-0 text-[#bbb]" />
                    <span className="truncate">{prd.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#e8e8e6] px-3 py-3">
        {/* Workspace switcher */}
        {workspaces && currentWorkspaceId && (
          <div className="mb-2">
            <WorkspaceSwitcher workspaces={workspaces} currentWorkspaceId={currentWorkspaceId} />
          </div>
        )}

        {/* User */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-white/60">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[12px] font-medium text-[#1a1a1a]">
                  {userName ?? 'User'}
                </p>
              </div>
              <ChevronDown size={12} className="text-[#bbb]" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            className="w-[220px] rounded-xl border-[#eee] p-0 shadow-xl"
          >
            <div className="border-b border-[#f0f0f0] px-4 py-3">
              <p className="text-[12px] font-medium text-[#1a1a1a]">{userName ?? 'User'}</p>
              <p className="text-[11px] text-[#aaa]">{userEmail ?? ''}</p>
            </div>
            <div className="py-1">
              <Link
                href="/settings/profile"
                className="flex h-9 items-center gap-2.5 px-4 text-[13px] text-[#555] transition-colors hover:bg-[#f5f5f4]"
              >
                <Settings size={14} className="text-[#999]" />
                Settings
              </Link>
            </div>
            <div className="border-t border-[#f0f0f0] py-1">
              <button
                onClick={handleLogout}
                className="flex h-9 w-full items-center gap-2.5 px-4 text-[13px] text-[#555] transition-colors hover:bg-[#f5f5f4]"
              >
                <LogOut size={14} className="text-[#999]" />
                Log out
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </aside>
  );
}
