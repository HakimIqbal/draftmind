'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  FileText,
  LayoutTemplate,
  Users,
  BarChart3,
  Settings,
  PanelLeft,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { LogoTier2 } from '@/components/icons/logo-tier2';
import { Avatar } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/prds', label: 'My PRDs', icon: FileText },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/workspace/members', label: 'Team', icon: Users },
  { href: '/ai-runs', label: 'Analytics', icon: BarChart3 },
];

interface SidebarCollapsedRailProps {
  onExpand: () => void;
  userName?: string;
  userEmail?: string;
}

export function SidebarCollapsedRail({ onExpand, userName, userEmail }: SidebarCollapsedRailProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoHovered, setLogoHovered] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-[52px] shrink-0 flex-col items-center border-r border-subtle bg-bg-canvas">
      {/* Top: Logo that transforms to open button on hover */}
      <div className="flex w-full flex-col items-center pb-2 pt-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onExpand}
              onMouseEnter={() => setLogoHovered(true)}
              onMouseLeave={() => setLogoHovered(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-bg-surface"
              aria-label="Open sidebar"
            >
              {logoHovered ? (
                <PanelLeft size={20} className="text-ink-primary" />
              ) : (
                <LogoTier2 size={24} />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Open sidebar</TooltipContent>
        </Tooltip>
      </div>

      {/* Nav icons */}
      <nav className="flex flex-1 flex-col items-center gap-0.5 pt-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                    isActive
                      ? 'bg-bg-surface text-ink-primary'
                      : 'text-ink-tertiary hover:bg-bg-surface hover:text-ink-primary',
                  )}
                >
                  <item.icon size={18} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom: avatar with popover */}
      <div className="pb-3 pt-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-bg-surface"
              aria-label="Profile menu"
            >
              <Avatar name={userName ?? 'User'} size="sm" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" align="end" className="w-[220px] p-0">
            {/* Email header */}
            <div className="border-b border-subtle px-md py-sm">
              <p className="truncate text-sm font-medium text-ink-primary">{userName ?? 'User'}</p>
              <p className="truncate font-mono text-xs text-ink-tertiary">{userEmail ?? ''}</p>
            </div>

            {/* Menu items */}
            <div className="py-xs">
              <Link
                href="/settings/profile"
                className="flex items-center gap-sm px-md py-sm text-sm text-ink-secondary transition-colors hover:bg-bg-surface hover:text-ink-primary"
              >
                <Settings size={16} className="shrink-0" />
                Settings
              </Link>
              <Link
                href="/help"
                className="flex items-center gap-sm px-md py-sm text-sm text-ink-secondary transition-colors hover:bg-bg-surface hover:text-ink-primary"
              >
                <HelpCircle size={16} className="shrink-0" />
                Help & support
              </Link>
            </div>

            {/* Logout */}
            <div className="border-t border-subtle py-xs">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-sm px-md py-sm text-sm text-ink-secondary transition-colors hover:bg-bg-surface hover:text-red-muted"
              >
                <LogOut size={16} className="shrink-0" />
                Log out
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </aside>
  );
}
