import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import type { ContinueWorkingPRD } from '@/lib/db/queries/dashboard';

interface ContinueWorkingCardProps {
  prd: ContinueWorkingPRD;
}

export function ContinueWorkingCard({ prd }: ContinueWorkingCardProps) {
  return (
    <Link href={`/prds/${prd.id}`}>
      <Card className="flex flex-col gap-xs p-sm transition-colors hover:border-strong">
        <span className="truncate text-sm font-medium text-ink-primary">{prd.title}</span>
        {prd.project_tag && (
          <span className="font-mono text-[11px] text-ink-tertiary">{prd.project_tag}</span>
        )}
        <div className="flex items-center gap-xs">
          <Pill status={prd.status as Parameters<typeof Pill>[0]['status']} />
          <span className="font-mono text-[11px] text-ink-tertiary">
            {formatDistanceToNow(new Date(prd.updated_at), { addSuffix: true })}
          </span>
        </div>
      </Card>
    </Link>
  );
}
