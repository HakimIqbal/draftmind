'use client';

import * as React from 'react';

import { cn } from '@/lib/utils/cn';

export interface SigilProps {
  section: number;
  sectionName: string;
  artboardId?: string;
  artboardName?: string;
  className?: string;
}

const Sigil = React.forwardRef<HTMLSpanElement, SigilProps>(
  ({ section, sectionName, artboardId, artboardName, className }, ref) => {
    const paddedSection = String(section).padStart(2, '0');

    return (
      <span
        ref={ref}
        className={cn(
          'font-mono text-[11px] uppercase tracking-wider text-ink-tertiary',
          className,
        )}
      >
        {'§ '}
        {paddedSection} {sectionName}
        {artboardId && artboardName && (
          <>
            {' · '}
            {artboardId} {artboardName}
          </>
        )}
      </span>
    );
  },
);
Sigil.displayName = 'Sigil';

export { Sigil };
