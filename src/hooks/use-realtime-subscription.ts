'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeConfig {
  /** Stable channel name (will be made unique per mount to avoid conflicts) */
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
 * - Unsubscribes on unmount (no channel leak).
 * - Handles React StrictMode double-invocation safely.
 * - Surfaces subscribe errors so the consumer can see them (e.g. on the
 *   "Something went wrong" error boundary).
 */
export function useRealtimeSubscription({ channel, table, filter, onChange }: RealtimeConfig) {
  const router = useRouter();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const supabase = createClient();
    // Unique per-mount channel name so a quick remount (or error recovery
    // that re-mounts the page) doesn't collide with a still-cleaning-up
    // channel from the previous mount. The stable `channel` is appended so
    // it remains recognisable in logs and `getChannels()` debugging.
    const uniqueChannelName = `${channel}-${Math.random().toString(36).slice(2, 10)}`;

    const sub: RealtimeChannel = supabase
      .channel(uniqueChannelName)
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
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          // Surface the realtime failure to the central error boundary so
          // the UI can show a meaningful state instead of crashing
          // silently and then tripping the "Something went wrong"
          // boundary on the next render.
           
          console.error('[realtime] subscription failed', {
            channel: uniqueChannelName,
            status,
            err,
          });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('lyra:realtime-error', {
                detail: { channel: uniqueChannelName, table, status, err: err?.message ?? null },
              }),
            );
          }
        }
      });

    return () => {
      // removeChannel is async; awaiting it inside cleanup isn't possible
      // but Supabase will still mark the channel for removal and drop
      // postgres_changes callbacks. The unique name prevents the new
      // mount from colliding with the in-flight teardown.
      supabase.removeChannel(sub);
    };
  }, [channel, table, filter, router]);
}
