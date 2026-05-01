import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface LogoTier1Props {
  size?: number;
  className?: string;
}

export function LogoTier1({ size = 280, className }: LogoTier1Props) {
  return (
    <Image
      src="/logo/logo.jpg"
      width={size}
      height={size}
      alt="DraftMind"
      className={cn('rounded-lg object-contain', className)}
      priority
    />
  );
}
