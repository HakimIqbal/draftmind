import { Card } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
}

export function StatCard({ label, value, delta }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-xs p-sm">
      <span className="text-2xl font-medium text-ink-primary">{value}</span>
      <span className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
        {label}
      </span>
      {delta && <span className="font-mono text-[11px] text-ink-secondary">{delta}</span>}
    </Card>
  );
}
