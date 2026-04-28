import { cn } from '@/lib/utils/cn';

interface GanRouterIconProps {
  className?: string;
  size?: number;
}

export function GanRouterIcon({ className, size = 24 }: GanRouterIconProps) {
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
      <circle cx="4" cy="12" r="2" />
      <circle cx="20" cy="6" r="2" />
      <circle cx="20" cy="12" r="2" />
      <circle cx="20" cy="18" r="2" />
      <path d="M6 12h6" />
      <path d="M12 12l6-6" />
      <path d="M12 12h6" />
      <path d="M12 12l6 6" />
    </svg>
  );
}
