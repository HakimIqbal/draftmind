'use client';

import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { PresenceUser } from '@/hooks/use-prd-presence';

interface SectionBadgeOverlayProps {
  editor: Editor | null;
  users: PresenceUser[];
  currentUserId: string;
}

type BadgeInfo = {
  key: string;
  top: number;
  users: PresenceUser[];
};

export function SectionBadgeOverlay({ editor, users, currentUserId }: SectionBadgeOverlayProps) {
  const [badges, setBadges] = useState<BadgeInfo[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const others = users.filter((u) => u.userId !== currentUserId && Boolean(u.activeSection));

    function recalc() {
      if (!editor || editor.isDestroyed || !overlayRef.current) return;

      // overlay is absolute inset-0 inside the relative container,
      // so its bounding rect == the container's bounding rect
      const containerRect = overlayRef.current.getBoundingClientRect();
      const newBadges: BadgeInfo[] = [];
      const seen = new Set<string>();

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== 'heading') return;
        const headingText = node.textContent.trim();
        if (!headingText || seen.has(headingText)) return;

        const activeUsers = others.filter((u) => u.activeSection === headingText);
        if (activeUsers.length === 0) return;
        seen.add(headingText);

        try {
          // coordsAtPos returns viewport coords; subtracting containerRect gives
          // position relative to the container — scroll-invariant because both
          // the container and its children move by the same amount on scroll
          const coords = editor.view.coordsAtPos(pos + 1);
          const relTop = coords.top - containerRect.top;
          newBadges.push({ key: headingText, top: relTop, users: activeUsers });
        } catch {
          // heading not rendered (hidden section) — skip
        }
      });

      setBadges(newBadges);
    }

    recalc();
    editor.on('update', recalc);
    window.addEventListener('resize', recalc);

    return () => {
      editor.off('update', recalc);
      window.removeEventListener('resize', recalc);
    };
  }, [editor, users, currentUserId]);

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 40 }}
    >
      {badges.map((badge) => (
        <div
          key={badge.key}
          className="absolute right-1 flex items-center gap-1"
          style={{ top: badge.top + 2 }}
        >
          {badge.users.map((user) => (
            <div
              key={user.userId}
              className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: user.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
              {user.name.split(' ')[0]}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
