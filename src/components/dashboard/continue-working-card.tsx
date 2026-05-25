import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, ArrowRight, FileText, Sparkles } from 'lucide-react';
import { Pill } from '@/components/ui/pill';
import type { ContinueWorkingPRD } from '@/lib/db/queries/dashboard';

function getHealthTone(score: number | null) {
  if (score === null) return { label: 'Not scored', className: 'text-[#999]', bar: 'bg-[#e7e5e4]' };
  if (score >= 85) return { label: 'Strong', className: 'text-emerald-600', bar: 'bg-emerald-500' };
  if (score >= 70) return { label: 'Review', className: 'text-amber-600', bar: 'bg-amber-500' };
  return { label: 'Needs work', className: 'text-red-500', bar: 'bg-red-500' };
}

function getFocusItems(prd: ContinueWorkingPRD): string[] {
  const items: string[] = [];

  if (prd.health_score === null) {
    items.push('Run AI Review');
  } else if (prd.health_score < 85) {
    items.push('Improve health score');
  } else {
    items.push('Review success metrics');
  }

  if (prd.status === 'draft') items.push('Prepare for review');
  if (prd.status === 'in_review' || prd.status === 'reviewed') items.push('Resolve review notes');
  if (prd.project_tag) items.push(prd.project_tag);

  return Array.from(new Set(items)).slice(0, 3);
}

export function ContinueWorkingCard({ prd }: { prd: ContinueWorkingPRD }) {
  const health = getHealthTone(prd.health_score);
  const healthValue = prd.health_score ?? 0;
  const focusItems = getFocusItems(prd);

  return (
    <Link
      href={`/prds/${prd.id}`}
      className="block rounded-xl border border-[#eee] bg-white p-4 transition-all hover:border-[#ddd] hover:shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f4]">
          <FileText size={16} className="text-[#888]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-[#1a1a1a]">{prd.title}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Pill status={prd.status as Parameters<typeof Pill>[0]['status']} />
                <span className="text-[11px] text-[#aaa]" suppressHydrationWarning>
                  Updated {formatDistanceToNow(new Date(prd.updated_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className={`text-[18px] font-bold leading-none ${health.className}`}>
                {prd.health_score !== null ? `${prd.health_score}%` : '--'}
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#aaa]">
                {health.label}
              </p>
            </div>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f5f5f4]">
            <div
              className={`h-full rounded-full ${health.bar}`}
              style={{ width: `${healthValue}%` }}
            />
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {focusItems.map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-lg bg-[#fafaf9] px-2.5 py-2"
              >
                {index === 0 ? (
                  <AlertTriangle size={12} className="shrink-0 text-amber-500" />
                ) : (
                  <Sparkles size={12} className="shrink-0 text-[#999]" />
                )}
                <span className="min-w-0 truncate text-[11px] font-medium text-[#666]">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-[11px] font-medium text-white">
              Continue editing <ArrowRight size={12} />
            </span>
            <span className="rounded-lg border border-[#eee] px-3 py-1.5 text-[11px] font-medium text-[#666]">
              Run AI Review
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
