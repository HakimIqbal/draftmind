import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

const DOT_COLORS: Record<PillStatus, string> = {
  draft: '#7A7468',
  in_review: '#C68B3D',
  reviewed: '#6B8E5A',
  refined: '#4A8C5C',
  final: '#E8743C',
  blocked: '#B85843',
  approved: '#6B8E5A',
  shipped: '#4A7CB8',
  archived: '#4A4640',
};

type PillStatus =
  | 'draft'
  | 'in_review'
  | 'reviewed'
  | 'refined'
  | 'final'
  | 'blocked'
  | 'approved'
  | 'shipped'
  | 'archived';

function defaultLabel(status: PillStatus): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export interface PillProps {
  status: PillStatus;
  label?: string;
  className?: string;
}

export const Pill = forwardRef<HTMLSpanElement, PillProps>(({ status, label, className }, ref) => {
  const dotColor = DOT_COLORS[status];
  const displayLabel = label ?? defaultLabel(status);

  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-2 rounded-sm border border-subtle px-2.5 py-1 font-mono text-xs',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor }} />
      {displayLabel}
    </span>
  );
});
Pill.displayName = 'Pill';
