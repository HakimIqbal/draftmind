'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BarChart3, Sparkles } from 'lucide-react';
import { Chip } from '@/components/ui/chip';

interface AiRun {
  id: string;
  type: string;
  prd_id: string | null;
  model_used: string | null;
  duration_ms: number | null;
  total_tokens: number | null;
  status: string;
  error_message: string | null;
  input_payload: { title?: string } | null;
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
  queued: { dot: 'bg-ink-quaternary', label: 'Queued', pulse: true },
};

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return diffDays === 1 ? '1d ago' : `${diffDays}d ago`;
}

function formatDuration(ms: number | null): string {
  if (ms == null) return '—';
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTokens(count: number | null): string {
  if (count == null) return '—';
  return count.toLocaleString();
}

function formatType(type: string | null | undefined): string {
  if (!type) return 'Unknown';
  const typeMap: Record<string, string> = {
    generate_prd: 'Generation',
    regenerate_prd: 'Generation',
    refine_section: 'Refine',
    ai_review: 'Review',
    inline_suggest: 'Suggest',
    quick_action: 'Suggest',
  };
  return typeMap[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AiRunHistoryTable({ runs }: { runs: AiRun[] }) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return runs;
    const typeMap: Record<FilterKey, string[]> = {
      all: [],
      generation: ['generate_prd', 'regenerate_prd'],
      refine: ['refine_section'],
      review: ['ai_review'],
      suggest: ['inline_suggest', 'quick_action'],
    };
    const types = typeMap[filter] ?? [];
    return runs.filter((r) => types.includes(r.type ?? ''));
  }, [runs, filter]);

  const summary = useMemo(() => {
    const success = runs.filter((r) => r.status === 'success').length;
    const failed = runs.filter((r) => r.status === 'error').length;
    const totalTokens = runs.reduce((sum, r) => sum + (r.total_tokens ?? 0), 0);
    const avgLatency =
      runs.length > 0
        ? Math.round(runs.reduce((sum, r) => sum + (r.duration_ms ?? 0), 0) / runs.length)
        : 0;
    return { success, failed, totalTokens, avgLatency };
  }, [runs]);

  const hasRuns = runs.length > 0;
  const hasFilteredRuns = filtered.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-lg py-lg">
      <div>
        <h1 className="text-[22px] font-bold text-ink-primary">AI Runs</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Track generations, refinements, reviews, and suggestions for this workspace.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-subtle bg-white p-4">
          <p className="text-[11px] font-medium uppercase text-ink-quaternary">Total runs</p>
          <p className="mt-1 text-[28px] font-bold text-ink-primary">{runs.length}</p>
          <p className="mt-1 text-xs text-ink-tertiary">All AI activity in this workspace</p>
        </div>
        <div className="rounded-xl border border-subtle bg-white p-4">
          <p className="text-[11px] font-medium uppercase text-ink-quaternary">Successful</p>
          <p className="mt-1 text-[28px] font-bold text-ink-primary">{summary.success}</p>
          <p className="mt-1 text-xs text-ink-tertiary">Completed without errors</p>
        </div>
        <div className="rounded-xl border border-subtle bg-white p-4">
          <p className="text-[11px] font-medium uppercase text-ink-quaternary">Failed</p>
          <p className="mt-1 text-[28px] font-bold text-ink-primary">{summary.failed}</p>
          <p className="mt-1 text-xs text-ink-tertiary">Runs that need attention</p>
        </div>
        <div className="rounded-xl border border-subtle bg-white p-4">
          <p className="text-[11px] font-medium uppercase text-ink-quaternary">Tokens used</p>
          <p className="mt-1 text-[28px] font-bold text-ink-primary">
            {summary.totalTokens.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-ink-tertiary">
            Avg latency: {summary.avgLatency ? `${(summary.avgLatency / 1000).toFixed(1)}s` : '—'}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-xs border-b border-subtle">
        {FILTERS.map((f) => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {!hasRuns ? (
        <div className="mt-8 rounded-2xl border border-subtle bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bg-surface text-ink-secondary">
            <Sparkles size={20} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink-primary">No AI activity yet</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-secondary">
            Generate a PRD, refine a section, review content, or request a suggestion and the run
            history will appear here automatically.
          </p>
        </div>
      ) : !hasFilteredRuns ? (
        <div className="mt-8 rounded-2xl border border-subtle bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bg-surface text-ink-secondary">
            <BarChart3 size={20} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink-primary">No runs for this filter</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-secondary">
            This workspace has AI activity, but none matches the selected tab yet. Try another
            filter or create a new run.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
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
                  dot: 'bg-ink-tertiary',
                  label: run.status ?? 'Unknown',
                };
                const dotColor = TYPE_COLORS[run.type] ?? 'bg-ink-tertiary';
                const prdTitle = (run.input_payload as Record<string, unknown> | null)?.title as
                  | string
                  | undefined;

                return (
                  <tr
                    key={run.id}
                    className="h-11 border-b border-subtle transition-colors hover:bg-bg-surface"
                  >
                    <td className="px-sm font-mono text-[11px] text-ink-tertiary">
                      {formatRelativeTime(run.created_at)}
                    </td>
                    <td className="px-sm">
                      <span className="inline-flex items-center gap-1.5 rounded-sm border border-subtle px-2 py-0.5 font-mono text-xs">
                        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                        {formatType(run.type)}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-sm text-sm">
                      {run.prd_id ? (
                        <Link
                          href={`/prds/${run.prd_id}`}
                          className="decoration-subtle text-ink-primary underline underline-offset-2 hover:decoration-ink-secondary"
                        >
                          {prdTitle ?? 'View PRD'}
                        </Link>
                      ) : (
                        <span className="text-ink-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-sm font-mono text-[11px] text-ink-secondary">
                      {run.model_used ?? '—'}
                    </td>
                    <td className="px-sm font-mono text-[11px] text-ink-secondary">
                      {formatDuration(run.duration_ms)}
                    </td>
                    <td
                      className="px-sm font-mono text-[11px] text-ink-secondary"
                      suppressHydrationWarning
                    >
                      {formatTokens(run.total_tokens)}
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
