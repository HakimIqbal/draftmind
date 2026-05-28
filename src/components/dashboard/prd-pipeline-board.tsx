'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import type { PRDListItem } from '@/lib/db/queries/prd';

const COLUMN_CONFIG = [
  { key: 'draft', label: 'Draft', dotColor: '#7A7468' },
  { key: 'in_review', label: 'In Review', dotColor: '#C68B3D' },
  { key: 'refined', label: 'Refined', dotColor: '#E8743C' },
  { key: 'approved', label: 'Approved', dotColor: '#5B8DEF' },
  { key: 'shipped', label: 'Shipped', dotColor: '#6B8E5A' },
] as const;

interface PRDPipelineBoardProps {
  columns: Record<string, PRDListItem[]>;
}

function HealthBadge({ score }: { score: number | null }) {
  if (score === null || !Number.isFinite(score)) return null;
  const color = score >= 80 ? '#6B8E5A' : score >= 60 ? '#C68B3D' : '#B85843';
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px]">
      <span className="h-1 w-1 rounded-full" style={{ background: color }} />
      {score}
    </span>
  );
}

export function PRDPipelineBoard({ columns }: PRDPipelineBoardProps) {
  return (
    <div className="p-lg">
      <div className="mb-md flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold">Pipeline</h1>
          <p className="font-mono text-[11px] text-ink-tertiary">
            Read-only view by status. Move PRDs by editing them.
          </p>
        </div>
        <Link
          href="/prds"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#e5e5e3] bg-white px-3 text-[12px] font-medium text-[#666] transition-colors hover:border-[#ddd] hover:text-[#1a1a1a]"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          List View
        </Link>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1100px] grid-cols-5 gap-md">
          {COLUMN_CONFIG.map((col) => {
            const items = columns[col.key] ?? [];
            return (
              <div key={col.key}>
                {/* Column header */}
                <div className="mb-sm flex items-center gap-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: col.dotColor }} />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                    {col.label}
                  </span>
                  <span className="font-mono text-[11px] text-ink-quaternary">{items.length}</span>
                </div>

                {/* Cards */}
                <div className="space-y-sm">
                  {items.map((prd) => {
                    const title =
                      typeof prd.title === 'string' && prd.title.trim()
                        ? prd.title
                        : 'Untitled PRD';
                    const updatedAt = prd.updated_at ? new Date(prd.updated_at) : null;
                    const updatedLabel =
                      updatedAt && !Number.isNaN(updatedAt.getTime())
                        ? formatDistanceToNow(updatedAt, { addSuffix: true })
                        : 'Recently updated';

                    return (
                      <Link key={prd.id} href={`/prds/${prd.id}`}>
                        <Card className="cursor-pointer p-sm transition-colors hover:border-strong">
                          <div className="flex items-start justify-between gap-xs">
                            <p className="text-sm font-medium leading-tight text-ink-primary">
                              {title}
                            </p>
                            <HealthBadge score={prd.health_score} />
                          </div>

                          {prd.project_tag && (
                            <p className="mt-xs font-mono text-[11px] text-ink-tertiary">
                              {prd.project_tag}
                            </p>
                          )}

                          <div className="mt-sm flex items-center justify-between">
                            <div className="flex -space-x-1">
                              {prd.owner && (
                                <Avatar
                                  name={prd.owner.full_name ?? 'User'}
                                  size="sm"
                                  avatarUrl={prd.owner.avatar_url}
                                  seed={prd.owner.avatar_color_seed ?? undefined}
                                />
                              )}
                            </div>
                            <span
                              className="font-mono text-[10px] text-ink-tertiary"
                              suppressHydrationWarning
                            >
                              {updatedLabel}
                            </span>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}

                  {items.length === 0 && (
                    <p className="py-lg text-center font-mono text-[11px] text-ink-quaternary">
                      No PRDs
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
