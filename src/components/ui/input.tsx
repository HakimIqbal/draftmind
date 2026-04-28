'use client';

import * as React from 'react';

import { cn } from '@/lib/utils/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'border-default flex h-9 w-full rounded-md border bg-bg-surface px-3 py-1 font-body text-body text-ink-primary shadow-sm transition-colors',
          'placeholder:text-ink-tertiary',
          'focus:ring-accent/20 focus:border-strong focus:outline-none focus:ring-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
