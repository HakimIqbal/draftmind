import { cn } from '@/lib/utils/cn';
import { LogoTier2 } from './logo-tier2';

interface LogoWithWordmarkProps {
  className?: string;
}

export function LogoWithWordmark({ className }: LogoWithWordmarkProps) {
  return (
    <div className={cn('flex items-center gap-sm', className)}>
      <LogoTier2 size={24} />
      <span className="font-body text-sm font-bold text-ink-primary">DraftMind</span>
    </div>
  );
}
