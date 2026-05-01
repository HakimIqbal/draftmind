import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface LogoTier2Props {
  size?: number;
  className?: string;
}

export function LogoTier2({ size = 28, className }: LogoTier2Props) {
  return (
    <Image
      src="/logo/logo.jpg"
      width={size}
      height={size}
      alt="DraftMind"
      className={cn('rounded-md object-contain', className)}
    />
  );
}
