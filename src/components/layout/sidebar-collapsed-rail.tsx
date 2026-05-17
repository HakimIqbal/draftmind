'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, FileText, LayoutTemplate, Users, BarChart3, PanelLeft, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { LogoTier2 } from '@/components/icons/logo-tier2';
import { ProfileModal } from '@/components/settings/profile-modal';
import { Avatar } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/user-store';

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
  userAvatarUrl?: string;
}

export function SidebarCollapsedRail({
  onExpand,
  userName,
  userEmail,
  userAvatarUrl,
}: SidebarCollapsedRailProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoHovered, setLogoHovered] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const storeName = useUserStore((s) => s.name);
  const storeAvatarUrl = useUserStore((s) => s.avatarUrl);
  const displayName = storeName || userName;
  const displayAvatar = storeAvatarUrl !== null ? storeAvatarUrl : userAvatarUrl;

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
              <Avatar name={displayName ?? 'User'} size="sm" avatarUrl={displayAvatar} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="end"
            className="w-[240px] overflow-hidden rounded-2xl border border-[#e8e8e6] bg-white p-0 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
          >
            <button
              onClick={() => setProfileOpen(true)}
              className="flex w-full items-center gap-3 border-b border-[#f0f0ee] px-4 py-3.5 text-left transition-colors hover:bg-[#fafaf9] focus:outline-none"
            >
              <Avatar name={displayName ?? 'User'} size="lg" avatarUrl={displayAvatar} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#1a1a1a]">
                  {displayName ?? 'User'}
                </p>
                <p className="truncate text-[11px] text-[#aaa]">{userEmail ?? ''}</p>
              </div>
            </button>
            <div className="relative z-[10000] p-1.5">
              <button
                onClick={handleLogout}
                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-[13px] text-red-500/80 transition-colors hover:bg-red-50 focus:outline-none"
              >
                <LogOut size={14} className="text-red-400/70" />
                Log out
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </aside>
  );
}
