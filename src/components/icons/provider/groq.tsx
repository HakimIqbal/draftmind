import { cn } from '@/lib/utils/cn';

interface GroqIconProps {
  className?: string;
  size?: number;
}

export function GroqIcon({ className, size = 24 }: GroqIconProps) {
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
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}
