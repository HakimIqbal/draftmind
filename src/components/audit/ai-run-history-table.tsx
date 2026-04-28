'use client';

import { useState, useMemo } from 'react';
import { Chip } from '@/components/ui/chip';
import Link from 'next/link';

interface AiRun {
  id: string;
  run_type: string;
  prd_id: string | null;
  prd_title: string | null;
  model: string | null;
  duration_ms: number | null;
  token_count: number | null;
  status: string;
  created_at: string;
}

type FilterKey = 'all' | 'generation' | 'refine' | 'review' | 'suggest';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'generation', label: 'Generation' },
  { key: 'refine', label: 'Refine' },
  { key: 'review', label: 'Review' },
  { key: 'suggest', label: 'Suggest' },
];

const TYPE_COLORS: Record<string, string> = {
  generation: 'bg-amber-500',
  refine: 'bg-[#6B8E5A]',
  review: 'bg-accent',
  suggest: 'bg-ink-tertiary',
};

const STATUS_CONFIG: Record<string, { dot: string; label: string; pulse?: boolean }> = {
  success: { dot: 'bg-[#6B8E5A]', label: 'Success' },
  error: { dot: 'bg-[#B85843]', label: 'Error' },
  running: { dot: 'bg-amber-500', label: 'Running', pulse: true },
};

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return '1d ago';
  return `${diffDays}d ago`;
}

function formatDuration(ms: number | null): string {
  if (ms == null) return '\u2014';
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTokens(count: number | null): string {
  if (count == null) return '\u2014';
  return count.toLocaleString();
}

function formatType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function AiRunHistoryTable({ runs }: { runs: AiRun[] }) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? runs : runs.filter((r) => r.run_type === filter)),
    [runs, filter],
  );

  return (
    <div className="mx-auto max-w-5xl px-lg py-lg">
      <h1 className="text-lg font-semibold text-ink-primary">AI run history</h1>

      <div className="mt-md flex items-center gap-xs border-b border-subtle">
        {FILTERS.map((f) => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-xl text-center text-sm text-ink-tertiary">No AI runs yet</p>
      ) : (
        <div className="mt-md overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-subtle font-mono text-[11px] uppercase text-ink-tertiary">
                <th className="h-8 px-sm font-normal">Time</th>
                <th className="h-8 px-sm font-normal">Type</th>
                <th className="h-8 px-sm font-normal">PRD</th>
                <th className="h-8 px-sm font-normal">Model</th>
                <th className="h-8 px-sm font-normal">Duration</th>
                <th className="h-8 px-sm font-normal">Tokens</th>
                <th className="h-8 px-sm font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((run) => {
                const statusCfg = STATUS_CONFIG[run.status] ?? {
                  dot: 'bg-[#6B8E5A]',
                  label: 'Success',
                };
                const dotColor = TYPE_COLORS[run.run_type] ?? 'bg-ink-tertiary';

                return (
                  <tr
                    key={run.id}
                    className="border-subtle/50 h-11 border-b transition-colors hover:bg-bg-surface"
                  >
                    <td className="px-sm font-mono text-[11px] text-ink-tertiary">
                      {formatRelativeTime(run.created_at)}
                    </td>
                    <td className="px-sm">
                      <span className="inline-flex items-center gap-1.5 rounded-sm border border-subtle px-2 py-0.5 font-mono text-xs">
                        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                        {formatType(run.run_type)}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-sm text-sm">
                      {run.prd_id && run.prd_title ? (
                        <Link
                          href={`/prds/${run.prd_id}`}
                          className="decoration-subtle text-ink-primary underline underline-offset-2 hover:decoration-ink-secondary"
                        >
                          {run.prd_title}
                        </Link>
                      ) : (
                        <span className="text-ink-tertiary">{'\u2014'}</span>
                      )}
                    </td>
                    <td className="px-sm font-mono text-[11px] text-ink-secondary">
                      {run.model ?? '\u2014'}
                    </td>
                    <td className="px-sm font-mono text-[11px] text-ink-secondary">
                      {formatDuration(run.duration_ms)}
                    </td>
                    <td className="px-sm font-mono text-[11px] text-ink-secondary">
                      {formatTokens(run.token_count)}
                    </td>
                    <td className="px-sm">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot} ${statusCfg.pulse ? 'animate-pulse' : ''}`}
                        />
                        {statusCfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
