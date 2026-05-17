'use client';

import { useState, useEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout/sidebar';
import { SidebarCollapsedRail } from '@/components/layout/sidebar-collapsed-rail';
import { Topbar } from '@/components/layout/topbar';
import type { WorkspaceListItem } from '@/lib/db/queries/workspace';
import { useUserStore } from '@/stores/user-store';
import { createClient } from '@/lib/supabase/client';
import { getUnresolvedTicketCount } from '@/app/(app)/tickets/actions';

interface AppShellProps {
  children: React.ReactNode;
  workspaces?: WorkspaceListItem[];
  currentWorkspaceId?: string;
  currentUserRole?: string;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  recentPRDs?: { id: string; title: string }[];
  openTicketCount?: number;
  userId?: string;
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
  openTicketCount = 0,
  userId,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const setOpenTicketCount = useUserStore((s) => s.setOpenTicketCount);

  // Sync initial server-rendered count to store
  useEffect(() => {
    setOpenTicketCount(openTicketCount);
  }, [openTicketCount, setOpenTicketCount]);

  // Global Realtime subscription — updates badge count from any page
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`app-shell-tickets-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          try {
            const count = await getUnresolvedTicketCount();
            setOpenTicketCount(count);
          } catch {
            // silent
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, setOpenTicketCount]);

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
            openTicketCount={openTicketCount}
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
