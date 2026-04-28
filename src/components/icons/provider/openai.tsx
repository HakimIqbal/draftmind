import { cn } from '@/lib/utils/cn';

interface OpenAIIconProps {
  className?: string;
  size?: number;
}

export function OpenAIIcon({ className, size = 24 }: OpenAIIconProps) {
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
      <polygon points="12,2 20.5,6.5 20.5,17.5 12,22 3.5,17.5 3.5,6.5" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="3.5" y1="6.5" x2="20.5" y2="17.5" />
      <line x1="20.5" y1="6.5" x2="3.5" y2="17.5" />
    </svg>
  );
}
