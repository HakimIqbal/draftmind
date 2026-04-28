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
  userName?: string;
  userEmail?: string;
}

export function AppShell({
  children,
  workspaces,
  currentWorkspaceId,
  userName,
  userEmail,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <TooltipProvider>
      <div className="flex h-screen">
        {sidebarCollapsed ? (
          <SidebarCollapsedRail onExpand={() => setSidebarCollapsed(false)} />
        ) : (
          <Sidebar
            collapsed={false}
            onToggleCollapse={() => setSidebarCollapsed(true)}
            workspaces={workspaces}
            currentWorkspaceId={currentWorkspaceId}
            userName={userName}
            userEmail={userEmail}
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
