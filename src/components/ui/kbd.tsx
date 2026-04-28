'use client';

import * as React from 'react';

import { cn } from '@/lib/utils/cn';

const Kbd = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <kbd
      ref={ref}
      className={cn(
        'bg-ink-quaternary/10 rounded-sm border border-subtle px-1.5 py-0.5 font-mono text-[11px] text-ink-tertiary',
        className,
      )}
      {...props}
    />
  ),
);
Kbd.displayName = 'Kbd';

export { Kbd };
