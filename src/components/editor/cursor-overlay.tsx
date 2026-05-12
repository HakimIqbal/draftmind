'use client';

import type { PresenceUser } from '@/hooks/use-prd-presence';

interface CursorOverlayProps {
  users: PresenceUser[];
  currentUserId: string;
}

export function CursorOverlay({ users, currentUserId }: CursorOverlayProps) {
  const others = users.filter((u) => u.userId !== currentUserId && u.cursor != null);
  if (others.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 50 }}>
      {others.map((user) => (
        <div
          key={user.userId}
          className="absolute"
          style={{
            transform: `translate(${user.cursor!.x}px, ${user.cursor!.y}px)`,
            transition: 'transform 80ms ease-out',
          }}
        >
          {/* Cursor arrow */}
          <svg
            width="12"
            height="16"
            viewBox="0 0 12 16"
            fill="none"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}
          >
            <path d="M0 0L12 8L5.5 9.5L3 16L0 0Z" fill={user.color} />
          </svg>
          {/* Name label */}
          <div
            className="mt-0.5 max-w-[100px] truncate rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight text-white"
            style={{ backgroundColor: user.color }}
          >
            {user.name.split(' ')[0]}
          </div>
        </div>
      ))}
    </div>
  );
}
