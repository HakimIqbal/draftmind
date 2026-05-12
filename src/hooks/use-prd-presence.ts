'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const CURSOR_COLORS = [
  '#E63946',
  '#2A9D8F',
  '#E9C46A',
  '#F4A261',
  '#A8DADC',
  '#457B9D',
  '#8338EC',
  '#FB5607',
  '#3A86FF',
  '#06D6A0',
];

export function getUserColor(userId: string): string {
  const index = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return CURSOR_COLORS[index % CURSOR_COLORS.length] ?? CURSOR_COLORS[0]!;
}

export type PresenceUser = {
  userId: string;
  name: string;
  email?: string;
  avatar: string | null;
  color: string;
  cursor?: { x: number; y: number };
  activeSection?: string;
};

type TrackedUser = {
  userId: string;
  name: string;
  email?: string;
  avatar: string | null;
  color: string;
};

export function usePrdPresence(
  prdId: string,
  currentUser: { id: string; name: string; email?: string; avatar: string | null } | null,
) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [contentUpdatedBy, setContentUpdatedBy] = useState<string | null>(null);
  const cursorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const broadcastChannelRef = useRef<RealtimeChannel | null>(null);
  const currentUserIdRef = useRef(currentUser?.id ?? '');
  const currentUserNameRef = useRef(currentUser?.name ?? '');
  currentUserIdRef.current = currentUser?.id ?? '';
  currentUserNameRef.current = currentUser?.name ?? '';

  useEffect(() => {
    if (!currentUser) return;

    const supabase = createClient();
    const color = getUserColor(currentUser.id);

    // Channel 1: Presence — track who is online
    const presenceChannel = supabase.channel(`presence-prd-${prdId}`, {
      config: { presence: { key: currentUser.id } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState<TrackedUser>();
        // Deduplicate by userId — keep the last entry per user
        // (multiple tabs from same user produce multiple presence entries)
        const uniqueUsers = Array.from(
          new Map(
            Object.values(state)
              .flat()
              .map((p) => [p.userId, p]),
          ).values(),
        ).map((p) => ({
          userId: p.userId,
          name: p.name,
          email: p.email,
          avatar: p.avatar,
          color: p.color,
        }));
        setOnlineUsers((prev) => {
          // Merge in cursor/section state that's already in prev
          return uniqueUsers.map((u) => {
            const existing = prev.find((p) => p.userId === u.userId);
            return existing ? { ...existing, ...u } : u;
          });
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            userId: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            avatar: currentUser.avatar,
            color,
          });
        }
      });

    // Channel 2: Broadcast — cursor positions + section focus
    const broadcastChannel = supabase.channel(`cursors-prd-${prdId}`);
    broadcastChannelRef.current = broadcastChannel;

    broadcastChannel
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        setOnlineUsers((prev) =>
          prev.map((u) =>
            u.userId === payload.userId
              ? { ...u, cursor: { x: payload.x as number, y: payload.y as number } }
              : u,
          ),
        );
      })
      .on('broadcast', { event: 'section' }, ({ payload }) => {
        setOnlineUsers((prev) =>
          prev.map((u) =>
            u.userId === payload.userId ? { ...u, activeSection: payload.section as string } : u,
          ),
        );
      })
      .on('broadcast', { event: 'content_saved' }, ({ payload }) => {
        // Ignore events from ourselves
        if ((payload.userId as string) === currentUser.id) return;
        setContentUpdatedBy((payload.userName as string) ?? 'Someone');
      })
      .subscribe();

    return () => {
      if (cursorDebounceRef.current) clearTimeout(cursorDebounceRef.current);
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [prdId, currentUser?.id, currentUser?.name, currentUser?.avatar]); // eslint-disable-line react-hooks/exhaustive-deps

  const broadcastCursor = useCallback((x: number, y: number) => {
    if (cursorDebounceRef.current) clearTimeout(cursorDebounceRef.current);
    cursorDebounceRef.current = setTimeout(() => {
      broadcastChannelRef.current?.send({
        type: 'broadcast',
        event: 'cursor',
        payload: { userId: currentUserIdRef.current, x, y },
      });
    }, 50);
  }, []);

  const broadcastSection = useCallback((section: string) => {
    broadcastChannelRef.current?.send({
      type: 'broadcast',
      event: 'section',
      payload: { userId: currentUserIdRef.current, section },
    });
  }, []);

  const broadcastContentSaved = useCallback(() => {
    broadcastChannelRef.current?.send({
      type: 'broadcast',
      event: 'content_saved',
      payload: { userId: currentUserIdRef.current, userName: currentUserNameRef.current },
    });
  }, []);

  const clearContentUpdate = useCallback(() => {
    setContentUpdatedBy(null);
  }, []);

  return {
    onlineUsers,
    broadcastCursor,
    broadcastSection,
    broadcastContentSaved,
    clearContentUpdate,
    contentUpdatedBy,
  };
}
