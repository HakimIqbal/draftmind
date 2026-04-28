import { cn } from '@/lib/utils/cn';

interface SumopodIconProps {
  className?: string;
  size?: number;
}

export function SumopodIcon({ className, size = 24 }: SumopodIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
    >
      <rect x="6" y="3" width="12" height="18" rx="6" />
      <line x1="6" y1="9" x2="18" y2="9" />
      <line x1="6" y1="15" x2="18" y2="15" />
    </svg>
  );
}
