'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function PipelineRealtimePoller({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const channelId = useRef(`pipeline-prds-${crypto.randomUUID()}`);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(channelId.current)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prds', filter: `workspace_id=eq.${workspaceId}` },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, router]);

  return null;
}
