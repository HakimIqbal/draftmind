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
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/prds', label: 'My PRDs', icon: FileText },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/workspace/members', label: 'Team', icon: Users },
  { href: '/settings/providers', label: 'Integrations', icon: Plug },
  { href: '/ai-runs', label: 'Analytics', icon: BarChart3 },
  { href: '/settings/profile', label: 'Settings', icon: Settings },
];

interface SidebarCollapsedRailProps {
  onExpand: () => void;
}

export function SidebarCollapsedRail({ onExpand }: SidebarCollapsedRailProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-14 shrink-0 flex-col items-center border-r border-subtle bg-bg-canvas py-md">
      {/* Expand button */}
      <button
        onClick={onExpand}
        className="mb-md text-ink-tertiary transition-colors hover:text-ink-primary"
        aria-label="Expand sidebar"
      >
        <PanelLeftOpen size={16} />
      </button>

      {/* Nav icons */}
      <nav className="flex flex-1 flex-col items-center gap-xs">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                    isActive
                      ? 'bg-bg-surface text-ink-primary'
                      : 'text-ink-secondary hover:bg-bg-surface hover:text-ink-primary',
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
    </aside>
  );
}
