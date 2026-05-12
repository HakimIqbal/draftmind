import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { FileText } from 'lucide-react';
import { Pill } from '@/components/ui/pill';
import type { ContinueWorkingPRD } from '@/lib/db/queries/dashboard';

export function ContinueWorkingCard({ prd }: { prd: ContinueWorkingPRD }) {
  return (
    <Link
      href={`/prds/${prd.id}`}
      className="flex items-start gap-4 rounded-xl border border-[#eee] bg-white p-4 transition-all hover:border-[#ddd] hover:shadow-sm"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f4]">
        <FileText size={15} className="text-[#999]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-[#1a1a1a]">{prd.title}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <Pill status={prd.status as Parameters<typeof Pill>[0]['status']} />
          {prd.project_tag && (
            <span className="truncate text-[11px] text-[#bbb]">{prd.project_tag}</span>
          )}
        </div>
        <p className="mt-1.5 text-[11px] text-[#bbb]" suppressHydrationWarning>
          {formatDistanceToNow(new Date(prd.updated_at), { addSuffix: true })}
        </p>
      </div>
    </Link>
  );
}
