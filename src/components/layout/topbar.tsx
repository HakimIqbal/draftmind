'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { NotificationsInbox } from '@/components/overlays/notifications-inbox';
import { createClient } from '@/lib/supabase/client';

export function Topbar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Read workspace from cookie
      const wsMatch = document.cookie.match(/current_workspace_id=([^;]+)/);
      if (wsMatch) {
        setWorkspaceId(wsMatch[1] ?? null);
      }

      // Fetch unread count
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadCount(count ?? 0);
    }
    init();
  }, []);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-subtle px-lg">
      {/* Left: breadcrumb placeholder */}
      <div />

      {/* Right: actions */}
      <div className="flex items-center gap-sm">
        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-bg-surface hover:text-ink-primary"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="overflow-hidden rounded-lg border-0 p-0">
            {userId && workspaceId && (
              <NotificationsInbox userId={userId} workspaceId={workspaceId} />
            )}
          </PopoverContent>
        </Popover>

        {/* New PRD */}
        <Button
          variant="outline"
          size="sm"
          className="hover:bg-accent/10 border-accent text-accent"
          onClick={() => console.log('New PRD clicked')}
        >
          + New PRD
        </Button>
      </div>
    </header>
  );
}
