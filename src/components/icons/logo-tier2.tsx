import { cn } from '@/lib/utils/cn';

interface LogoTier2Props {
  size?: number;
  className?: string;
}

export function LogoTier2({ size = 28, className }: LogoTier2Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-label="DraftMind"
    >
      <circle cx="14" cy="14" r="14" className="fill-accent" />
      <text
        x="14"
        y="19"
        textAnchor="middle"
        className="fill-[#F2EFE8] font-display text-[16px] font-bold"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        D
      </text>
    </svg>
  );
}
