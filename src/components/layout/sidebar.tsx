'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  FileText,
  LayoutTemplate,
  Users,
  Plug,
  BarChart3,
  Settings,
  Pin,
  Search,
  PanelLeftClose,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Avatar } from '@/components/ui/avatar';
import { Kbd } from '@/components/ui/kbd';
import { WorkspaceSwitcher } from './workspace-switcher';
import type { WorkspaceListItem } from '@/lib/db/queries/workspace';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/prds', label: 'My PRDs', icon: FileText, badge: '0' },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/workspace/members', label: 'Team', icon: Users },
  { href: '/settings/providers', label: 'Integrations', icon: Plug },
  { href: '/ai-runs', label: 'Analytics', icon: BarChart3 },
  { href: '/settings/profile', label: 'Settings', icon: Settings },
];

const PINNED_PRDS = [
  { id: '1', title: 'Q2 Growth Strategy PRD' },
  { id: '2', title: 'Payment Integration RFC' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  workspaces?: WorkspaceListItem[];
  currentWorkspaceId?: string;
  userName?: string;
  userEmail?: string;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  workspaces,
  currentWorkspaceId,
  userName,
  userEmail,
}: SidebarProps) {
  const pathname = usePathname();

  if (collapsed) {
    return null;
  }

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-subtle bg-bg-canvas">
      {/* Header: Logo + workspace + collapse */}
      <div className="flex items-center justify-between px-lg py-md">
        {workspaces && currentWorkspaceId ? (
          <WorkspaceSwitcher workspaces={workspaces} currentWorkspaceId={currentWorkspaceId} />
        ) : (
          <span className="text-sm font-medium text-ink-primary">DraftMind</span>
        )}
        <button
          onClick={onToggleCollapse}
          className="text-ink-tertiary transition-colors hover:text-ink-primary"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="px-sm pb-sm">
        <button className="flex h-8 w-full items-center gap-sm rounded-md border border-subtle bg-bg-surface px-sm text-left font-mono text-xs text-ink-tertiary transition-colors hover:border-strong">
          <Search size={14} />
          <span className="flex-1">Search or ask AI</span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-xs">
        <ul className="space-y-px">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-8 items-center gap-sm rounded-md px-sm text-sm transition-colors',
                    isActive
                      ? 'border-l-2 border-accent bg-bg-surface text-ink-primary'
                      : 'text-ink-secondary hover:bg-bg-surface hover:text-ink-primary',
                  )}
                >
                  <item.icon size={18} className="shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="font-mono text-[11px] text-ink-tertiary">{item.badge}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Workspaces section */}
        <div className="mt-lg">
          <h3 className="mb-xs px-sm font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
            Workspaces
          </h3>
          <ul className="space-y-px">
            <li>
              <button className="flex h-7 w-full items-center gap-sm rounded-md px-sm text-left text-sm text-ink-secondary transition-colors hover:bg-bg-surface hover:text-ink-primary">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span className="truncate">Algo Network</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Pinned section */}
        <div className="mt-lg">
          <h3 className="mb-xs px-sm font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
            Pinned
          </h3>
          <ul className="space-y-px">
            {PINNED_PRDS.map((prd) => (
              <li key={prd.id}>
                <button className="flex h-7 w-full items-center gap-sm rounded-md px-sm text-left text-sm text-ink-secondary transition-colors hover:bg-bg-surface hover:text-ink-primary">
                  <Pin size={12} className="shrink-0 text-ink-tertiary" />
                  <span className="truncate">{prd.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Bottom: User */}
      <div className="border-t border-subtle px-sm py-sm">
        <div className="flex items-center gap-sm rounded-md px-xs py-xs">
          <Avatar name={userName ?? 'User'} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink-primary">{userName ?? 'User'}</p>
            <p className="truncate font-mono text-[11px] text-ink-tertiary">{userEmail ?? ''}</p>
          </div>
          <Link
            href="/settings/profile"
            className="text-ink-tertiary transition-colors hover:text-ink-primary"
          >
            <Settings size={14} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
