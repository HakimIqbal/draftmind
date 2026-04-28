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
  { key: 'final', label: 'Final', dotColor: '#6B8E5A' },
] as const;

interface PRDPipelineBoardProps {
  columns: Record<string, PRDListItem[]>;
}

function HealthBadge({ score }: { score: number | null }) {
  if (score === null) return null;
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
      <div className="mb-md">
        <h1 className="font-display text-xl font-bold">Pipeline</h1>
        <p className="font-mono text-[11px] text-ink-tertiary">
          Read-only view by status. Move PRDs by editing them.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-md">
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
                {items.map((prd) => (
                  <Link key={prd.id} href={`/prds/${prd.id}`}>
                    <Card className="cursor-pointer p-sm transition-colors hover:border-strong">
                      <div className="flex items-start justify-between gap-xs">
                        <p className="text-sm font-medium leading-tight text-ink-primary">
                          {prd.title}
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
                          {prd.owner && <Avatar name={prd.owner.full_name ?? 'User'} size="sm" />}
                        </div>
                        <span className="font-mono text-[10px] text-ink-tertiary">
                          {formatDistanceToNow(new Date(prd.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}

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
  );
}
