'use client';

import { useState, useEffect, useRef } from 'react';
import { getUserColor } from '@/hooks/use-prd-presence';
import type { PresenceUser } from '@/hooks/use-prd-presence';

interface PresenceAvatarsProps {
  users: PresenceUser[];
  currentUserId: string;
}

type DisplayEntry = {
  user: PresenceUser;
  opacity: number;
  leaving: boolean;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]![0] ?? '') : '';
  return (first + last).toUpperCase();
}

function AvatarCircle({
  user,
  color,
  className,
}: {
  user: PresenceUser;
  color: string;
  className: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = Boolean(user.avatar) && !imgFailed;

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-full font-bold text-white ${className}`}
      style={{ backgroundColor: showPhoto ? 'white' : color }}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatar!}
          alt={user.name}
          className="h-full w-full rounded-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        getInitials(user.name)
      )}
    </div>
  );
}

export function PresenceAvatars({ users, currentUserId }: PresenceAvatarsProps) {
  const [entries, setEntries] = useState<DisplayEntry[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const leaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const currentIds = new Set(users.map((u) => u.userId));

    setEntries((prev) => {
      const prevMap = new Map(prev.map((e) => [e.user.userId, e]));
      const result: DisplayEntry[] = [];

      for (const u of users) {
        const existing = prevMap.get(u.userId);
        if (existing) {
          const timer = leaveTimers.current.get(u.userId);
          if (timer) {
            clearTimeout(timer);
            leaveTimers.current.delete(u.userId);
          }
          result.push({
            user: u,
            opacity: existing.leaving ? 0 : existing.opacity,
            leaving: false,
          });
        } else {
          result.push({ user: u, opacity: 0, leaving: false });
        }
      }

      for (const e of prev) {
        if (!currentIds.has(e.user.userId)) {
          if (!e.leaving) {
            const timer = setTimeout(() => {
              setEntries((p) => p.filter((x) => x.user.userId !== e.user.userId));
              leaveTimers.current.delete(e.user.userId);
            }, 320);
            leaveTimers.current.set(e.user.userId, timer);
          }
          result.push({ ...e, leaving: true, opacity: 0 });
        }
      }

      return result;
    });

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setEntries((prev) =>
        prev.map((e) => (!e.leaving && e.opacity === 0 ? { ...e, opacity: 1 } : e)),
      );
    });
  }, [users]);

  useEffect(() => {
    const timers = leaveTimers.current;
    const raf = rafRef;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  useEffect(() => {
    if (!openId) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-presence-avatar]')) {
        setOpenId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openId]);

  if (entries.length === 0) return null;

  return (
    <div className="flex items-end gap-2">
      {entries.map(({ user, opacity }) => {
        const isCurrent = user.userId === currentUserId;
        // Always derive color from userId as ground truth — user.color may be stale/missing
        const color = user.color || getUserColor(user.userId);
        const isOpen = openId === user.userId;

        return (
          <div
            key={user.userId}
            className="relative flex flex-col items-center gap-0.5"
            data-presence-avatar=""
            style={{ transition: 'opacity 300ms ease', opacity }}
          >
            {/* Avatar button */}
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : user.userId)}
              className="flex h-8 w-8 cursor-pointer select-none overflow-hidden rounded-full transition-transform hover:scale-110 focus:outline-none active:scale-95"
              style={{
                border: `2px ${isCurrent ? 'dashed' : 'solid'} ${color}`,
                opacity: isCurrent ? 0.75 : 1,
              }}
              title={user.name}
            >
              <AvatarCircle user={user} color={color} className="h-full w-full text-[11px]" />
            </button>

            {/* "You" label — only for current user, below the avatar */}
            {isCurrent ? (
              <span
                className="whitespace-nowrap text-[9px] font-semibold leading-none"
                style={{ color }}
              >
                You
              </span>
            ) : (
              // Invisible spacer so all avatars are top-aligned in the row
              <span className="invisible select-none text-[9px] leading-none">·</span>
            )}

            {/* Popover */}
            {isOpen && (
              <div
                className="absolute bottom-full left-1/2 z-50 mb-3 min-w-[180px] -translate-x-1/2 rounded-xl border border-[#e4e4e7] bg-white p-3 shadow-xl"
                data-presence-avatar=""
              >
                {/* Arrow */}
                <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-[#e4e4e7] bg-white" />

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2.5">
                    <AvatarCircle
                      user={user}
                      color={color}
                      className="h-9 w-9 shrink-0 text-[12px]"
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="max-w-[120px] truncate text-[13px] font-semibold leading-snug text-[#111]">
                        {user.name}
                        {isCurrent && (
                          <span className="ml-1.5 text-[10px] font-medium text-[#999]">(You)</span>
                        )}
                      </span>
                      {user.email && (
                        <span className="max-w-[120px] truncate text-[11px] leading-tight text-[#888]">
                          {user.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {user.activeSection && (
                    <div className="flex items-center gap-1 border-t border-[#f0f0f0] pt-2 text-[11px] text-[#666]">
                      <span>📍</span>
                      <span className="max-w-[140px] truncate">Editing: {user.activeSection}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
