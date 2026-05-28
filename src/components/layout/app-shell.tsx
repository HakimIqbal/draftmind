'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout/sidebar';
import { SidebarCollapsedRail } from '@/components/layout/sidebar-collapsed-rail';
import { Topbar } from '@/components/layout/topbar';
import type { WorkspaceListItem } from '@/lib/db/queries/workspace';
import { useUserStore } from '@/stores/user-store';
import { createClient } from '@/lib/supabase/client';
import { getUnresolvedTicketCount } from '@/app/(app)/tickets/actions';
import { PresenceHeartbeat } from '@/components/presence/presence-heartbeat';

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const setOpenTicketCount = useUserStore((s) => s.setOpenTicketCount);
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const wsChannelId = useRef(`app-shell-workspace-${crypto.randomUUID()}`);
  const prdChannelId = useRef(`app-shell-prds-${crypto.randomUUID()}`);
  const hasWorkspace = Boolean(currentWorkspaceId);

  useEffect(() => {
    pathnameRef.current = pathname;
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileSidebarOpen]);

  // Sync initial server-rendered count to store
  useEffect(() => {
    setOpenTicketCount(openTicketCount);
  }, [openTicketCount, setOpenTicketCount]);

  // Realtime — workspace name/icon update → refresh SSR props for sidebar + switcher
  useEffect(() => {
    if (!currentWorkspaceId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(wsChannelId.current)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workspaces',
          filter: `id=eq.${currentWorkspaceId}`,
        },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId, router]);

  // Realtime — PRD changes → update sidebar recentPRDs; skip refresh on editor to avoid content reset
  useEffect(() => {
    if (!currentWorkspaceId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(prdChannelId.current)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prds',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        () => {
          if (/^\/prds\/[^/]+$/.test(pathnameRef.current)) return;
          router.refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId, router]);

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

  const sidebar = (
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
      hasWorkspace={hasWorkspace}
    />
  );

  return (
    <TooltipProvider>
      <PresenceHeartbeat />
      <div className="flex h-dvh min-h-dvh overflow-hidden">
        <div className="hidden md:block">
          {sidebarOpen ? (
            sidebar
          ) : (
            <SidebarCollapsedRail
              onExpand={() => setSidebarOpen(true)}
              userName={userName}
              userEmail={userEmail}
              userAvatarUrl={userAvatarUrl}
              hasWorkspace={hasWorkspace}
            />
          )}
        </div>

        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
            <button
              type="button"
              className="absolute inset-0 bg-black/30"
              aria-label="Close menu"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative h-[100dvh] w-[min(85vw,250px)] shadow-2xl">{sidebar}</div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar hasWorkspace={hasWorkspace} onToggleSidebar={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
