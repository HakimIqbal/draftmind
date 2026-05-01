'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const TABS = [
  { href: '/settings/profile', label: 'Profile' },
  { href: '/settings/preferences', label: 'Preferences' },
  { href: '/settings/notifications', label: 'Notifications' },
  { href: '/settings/audit', label: 'Audit' },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-[#f0f0ee]">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              '-mb-px border-b-2 px-3 pb-3 text-[13px] font-medium transition-colors',
              isActive
                ? 'border-[#1a1a1a] text-[#1a1a1a]'
                : 'border-transparent text-[#999] hover:text-[#555]',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
