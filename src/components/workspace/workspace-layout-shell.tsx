'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Users, Settings, Activity } from 'lucide-react';

interface Props {
  workspaceName: string;
  currentUserRole: string;
  children: React.ReactNode;
}

const TABS = [
  { href: '/workspace/members', label: 'Members', icon: Users, adminOnly: false },
  { href: '/workspace/settings', label: 'Settings', icon: Settings, adminOnly: true },
  { href: '/workspace/activity', label: 'Activity', icon: Activity, adminOnly: true },
];

export function WorkspaceLayoutShell({ workspaceName, currentUserRole, children }: Props) {
  const pathname = usePathname();
  const isAdmin = currentUserRole === 'admin';

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">{workspaceName}</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 border-b border-[#eee]">
        {TABS.filter((t) => !t.adminOnly || isAdmin).map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href + '/');
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                active
                  ? 'border-[#1a1a1a] text-[#1a1a1a]'
                  : 'border-transparent text-[#999] hover:text-[#555]'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
