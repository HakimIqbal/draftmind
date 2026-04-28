import { cn } from '@/lib/utils/cn';

interface AnthropicIconProps {
  className?: string;
  size?: number;
}

export function AnthropicIcon({ className, size = 24 }: AnthropicIconProps) {
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
      <path d="M12 3L3 21h6l3-6 3 6h6L12 3z" />
    </svg>
  );
}
