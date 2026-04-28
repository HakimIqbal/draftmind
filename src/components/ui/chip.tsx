'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ active = false, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'cursor-pointer px-2.5 py-1 font-mono text-xs transition',
          active
            ? 'border-b-2 border-accent text-ink-primary'
            : 'text-ink-secondary hover:text-ink-primary',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Chip.displayName = 'Chip';
