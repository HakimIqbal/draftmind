'use client';

import { useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout/sidebar';
import { SidebarCollapsedRail } from '@/components/layout/sidebar-collapsed-rail';
import { Topbar } from '@/components/layout/topbar';
import type { WorkspaceListItem } from '@/lib/db/queries/workspace';

interface AppShellProps {
  children: React.ReactNode;
  workspaces?: WorkspaceListItem[];
  currentWorkspaceId?: string;
  currentUserRole?: string;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  recentPRDs?: { id: string; title: string }[];
}

export function AppShell({
  children,
  workspaces,
  currentWorkspaceId,
  currentUserRole,
  userName,
  userEmail,
  userAvatarUrl,
  recentPRDs,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <TooltipProvider>
      <div className="flex h-screen">
        {sidebarOpen ? (
          <Sidebar
            collapsed={false}
            onToggleCollapse={() => setSidebarOpen(false)}
            workspaces={workspaces}
            currentWorkspaceId={currentWorkspaceId}
            currentUserRole={currentUserRole}
            userName={userName}
            userEmail={userEmail}
            userAvatarUrl={userAvatarUrl}
            recentPRDs={recentPRDs}
          />
        ) : (
          <SidebarCollapsedRail
            onExpand={() => setSidebarOpen(true)}
            userName={userName}
            userEmail={userEmail}
            userAvatarUrl={userAvatarUrl}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
