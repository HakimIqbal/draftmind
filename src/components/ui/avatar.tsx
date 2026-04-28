'use client';

import * as React from 'react';

import { cn } from '@/lib/utils/cn';

const MUTED_PALETTE = [
  'bg-[#e8d5c4] text-[#6b4c3b]', // warm sand
  'bg-[#c4d7e0] text-[#3b5c6b]', // slate blue
  'bg-[#d4c4e0] text-[#5c3b6b]', // muted lavender
  'bg-[#c4e0d4] text-[#3b6b5c]', // sage green
  'bg-[#e0d4c4] text-[#6b5c3b]', // dusty gold
  'bg-[#e0c4c4] text-[#6b3b3b]', // muted rose
  'bg-[#c4d4e0] text-[#3b4c6b]', // cool grey-blue
  'bg-[#d4e0c4] text-[#4c6b3b]', // olive green
] as const;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '??';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]![0] ?? '') : '';
  return (first + last).toUpperCase();
}

const sizeMap = {
  sm: { dimension: 'h-5 w-5', text: 'text-[10px]' },
  md: { dimension: 'h-6 w-6', text: 'text-[11px]' },
  lg: { dimension: 'h-8 w-8', text: 'text-[12px]' },
} as const;

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  seed?: string;
  className?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, size = 'md', seed, className }, ref) => {
    const initials = getInitials(name);
    const colorIndex = hashString(seed ?? name) % MUTED_PALETTE.length;
    const colorClasses = MUTED_PALETTE[colorIndex];
    const { dimension, text } = sizeMap[size];

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex shrink-0 select-none items-center justify-center rounded-full font-mono font-medium',
          dimension,
          text,
          colorClasses,
          className,
        )}
        title={name}
      >
        {initials}
      </div>
    );
  },
);
Avatar.displayName = 'Avatar';

export { Avatar };
