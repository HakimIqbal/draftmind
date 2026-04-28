'use client';

import * as React from 'react';

import { cn } from '@/lib/utils/cn';

export interface ProgressRingProps {
  value: number;
  max?: number;
  size?: 64 | 96 | 120;
  className?: string;
  children?: React.ReactNode;
}

const ProgressRing = React.forwardRef<HTMLDivElement, ProgressRingProps>(
  ({ value, max = 100, size = 64, className, children }, ref) => {
    const strokeWidth = size <= 64 ? 2 : 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(max, Math.max(0, value));
    const offset = circumference - (progress / max) * circumference;

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: size, height: size }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-ink-quaternary/20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-accent transition-all duration-300"
          />
        </svg>
        {children && (
          <div className="absolute inset-0 flex items-center justify-center">{children}</div>
        )}
      </div>
    );
  },
);
ProgressRing.displayName = 'ProgressRing';

export { ProgressRing };
