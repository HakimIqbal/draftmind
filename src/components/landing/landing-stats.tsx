'use client';

import { useEffect, useState } from 'react';

type LandingStatsProps = {
  sectionCount: number;
  exportCount: number;
  fallbackTemplateCount: number;
};

export function LandingStats({
  sectionCount,
  exportCount,
  fallbackTemplateCount,
}: LandingStatsProps) {
  const [templateCount, setTemplateCount] = useState(fallbackTemplateCount);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      try {
        const response = await fetch('/api/public/stats', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { templateCount?: number | null };
        if (active && typeof payload.templateCount === 'number') {
          setTemplateCount(payload.templateCount);
        }
      } catch {
        // Keep static fallback if the stats endpoint is unavailable.
      }
    }

    void loadStats();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto mt-14 flex max-w-md items-center justify-center gap-8 border-t border-black/[0.06] pt-8">
      <div className="text-center">
        <p className="font-display text-[24px] font-bold text-ink-primary">{sectionCount}</p>
        <p className="text-[11px] text-ink-tertiary">PRD Sections</p>
      </div>
      <div className="h-8 w-px bg-black/[0.06]" />
      <div className="text-center">
        <p className="font-display text-[24px] font-bold text-ink-primary">{templateCount}</p>
        <p className="text-[11px] text-ink-tertiary">Templates</p>
      </div>
      <div className="h-8 w-px bg-black/[0.06]" />
      <div className="text-center">
        <p className="font-display text-[24px] font-bold text-ink-primary">{exportCount}</p>
        <p className="text-[11px] text-ink-tertiary">Export Formats</p>
      </div>
    </div>
  );
}
