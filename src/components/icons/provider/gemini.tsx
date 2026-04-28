import { cn } from '@/lib/utils/cn';

interface GeminiIconProps {
  className?: string;
  size?: number;
}

export function GeminiIcon({ className, size = 24 }: GeminiIconProps) {
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
      <path d="M12 2L16 12L12 22L8 12Z" />
      <path d="M2 12L12 8L22 12L12 16Z" />
    </svg>
  );
}
