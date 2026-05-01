import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface LogoWithWordmarkProps {
  className?: string;
}

export function LogoWithWordmark({ className }: LogoWithWordmarkProps) {
  return (
    <div className={cn('flex items-center gap-sm', className)}>
      <Image
        src="/logo/logo.jpg"
        width={24}
        height={24}
        alt="DraftMind"
        className="rounded-md object-contain"
      />
      <span className="font-body text-sm font-bold text-ink-primary">DraftMind</span>
    </div>
  );
}
