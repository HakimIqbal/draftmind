'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  Activity,
  PanelLeftClose,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Avatar } from '@/components/ui/avatar';
import { WorkspaceSwitcher } from './workspace-switcher';
import { ProfileModal } from '@/components/settings/profile-modal';
import { createClient } from '@/lib/supabase/client';
import { logLogout } from '@/app/(app)/actions';
import type { WorkspaceListItem } from '@/lib/db/queries/workspace';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/prds', label: 'My PRDs', icon: FileText },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/ai-runs', label: 'Analytics', icon: BarChart3 },
];

const WORKSPACE_NAV = [
  { href: '/workspace/members', label: 'Members', icon: Users },
  { href: '/workspace/settings', label: 'Settings', icon: Settings, adminOnly: true },
  { href: '/workspace/activity', label: 'Activity', icon: Activity, adminOnly: true },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  workspaces?: WorkspaceListItem[];
  currentWorkspaceId?: string;
  currentUserRole?: string;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  recentPRDs?: { id: string; title: string }[];
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  workspaces,
  currentWorkspaceId,
  currentUserRole,
  userName,
  userEmail,
  userAvatarUrl,
  recentPRDs,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (collapsed) return null;

  async function handleLogout() {
    await logLogout().catch(() => {});
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

        {/* Workspace section */}
        <div className="mt-5">
          <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-[#aaa]">
            Workspace
          </p>
          <ul className="space-y-[2px]">
            {WORKSPACE_NAV.filter(
              (item) => !('adminOnly' in item && item.adminOnly) || currentUserRole === 'admin',
            ).map((item) => {
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
        </div>

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
        <UserMenu
          userName={userName}
          userEmail={userEmail}
          avatarUrl={userAvatarUrl}
          onLogout={handleLogout}
        />
      </div>
    </aside>
  );
}

function UserMenu({
  userName,
  userEmail,
  avatarUrl,
  onLogout,
}: {
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const updatePos = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.left, width: rect.width });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    function handleClick(e: MouseEvent) {
      requestAnimationFrame(() => {
        if (
          triggerRef.current?.contains(e.target as Node) ||
          dropdownRef.current?.contains(e.target as Node)
        )
          return;
        setOpen(false);
      });
    }
    document.addEventListener('mouseup', handleClick);
    return () => document.removeEventListener('mouseup', handleClick);
  }, [open, updatePos]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-white/60 focus:outline-none"
      >
        <Avatar name={userName ?? 'User'} size="sm" avatarUrl={avatarUrl} />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-[12px] font-medium text-[#1a1a1a]">{userName ?? 'User'}</p>
        </div>
        <ChevronDown
          size={12}
          className={`text-[#bbb] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] w-[240px] overflow-hidden rounded-2xl border border-[#e8e8e6] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
            style={{ top: pos.top - 8, left: pos.left, transform: 'translateY(-100%)' }}
          >
            <button
              onClick={() => {
                setOpen(false);
                setProfileOpen(true);
              }}
              className="flex w-full items-center gap-3 border-b border-[#f0f0ee] px-4 py-3.5 text-left transition-colors hover:bg-[#fafaf9] focus:outline-none"
            >
              <Avatar name={userName ?? 'User'} size="lg" avatarUrl={avatarUrl} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#1a1a1a]">
                  {userName ?? 'User'}
                </p>
                <p className="truncate text-[11px] text-[#aaa]">{userEmail ?? ''}</p>
              </div>
            </button>
            <div className="relative z-[10000] p-1.5">
              <button
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-[13px] text-red-500/80 transition-colors hover:bg-red-50 focus:outline-none"
              >
                <LogOut size={14} className="text-red-400/70" />
                Log out
              </button>
            </div>
          </div>,
          document.body,
        )}
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
