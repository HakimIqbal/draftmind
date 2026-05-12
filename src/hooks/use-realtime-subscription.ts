'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface RealtimeConfig {
  /** Unique channel name — must be stable across renders */
  channel: string;
  /** Table to subscribe to */
  table: string;
  /** Optional Postgres filter (e.g. 'recipient_id=eq.abc-123') */
  filter?: string;
  /** Custom callback on change. Defaults to router.refresh() */
  onChange?: () => void;
}

/**
 * Subscribe to Supabase Realtime postgres_changes for a table.
 * Automatically unsubscribes on unmount (no channel leak).
 */
export function useRealtimeSubscription({ channel, table, filter, onChange }: RealtimeConfig) {
  const router = useRouter();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const supabase = createClient();

    const sub = supabase
      .channel(channel)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        () => {
          if (onChangeRef.current) {
            onChangeRef.current();
          } else {
            router.refresh();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [channel, table, filter, router]);
}
