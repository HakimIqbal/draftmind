'use client';

import * as React from 'react';

import { cn } from '@/lib/utils/cn';

export interface ProgressBarProps {
  value: number;
  className?: string;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, className }, ref) => {
    const clamped = Math.min(100, Math.max(0, value));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          'bg-ink-quaternary/20 h-[2px] w-full overflow-hidden rounded-full',
          className,
        )}
      >
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  },
);
ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };
