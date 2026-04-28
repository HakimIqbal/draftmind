'use client';

import * as React from 'react';

import { cn } from '@/lib/utils/cn';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'border-default resize-vertical flex w-full rounded-md border bg-bg-surface px-3 py-2 font-body text-body text-ink-primary shadow-sm transition-colors',
          'placeholder:text-ink-tertiary',
          'focus:ring-accent/20 focus:border-strong focus:outline-none focus:ring-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        rows={rows}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
