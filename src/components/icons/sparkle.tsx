import { cn } from '@/lib/utils/cn';

interface SparkleProps {
  size?: number;
  className?: string;
}

export function Sparkle({ size = 16, className }: SparkleProps) {
  return (
    <span
      className={cn('inline-flex items-center justify-center text-accent', className)}
      style={{ fontSize: size, lineHeight: 1 }}
      aria-hidden="true"
    >
      ✦
    </span>
  );
}
