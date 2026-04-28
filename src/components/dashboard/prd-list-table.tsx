'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useCallback } from 'react';
import { Search, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Chip } from '@/components/ui/chip';
import { Pill } from '@/components/ui/pill';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import type { PRDListItem } from '@/lib/db/queries/prd';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'in_review', label: 'In Review' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'refined', label: 'Refined' },
  { value: 'final', label: 'Final' },
  { value: 'archived', label: 'Archived' },
] as const;

interface PRDListTableProps {
  items: PRDListItem[];
  total: number;
  currentStatus: string;
  currentSearch: string;
  onFilterChange: (status: string) => void;
  onSearchChange: (search: string) => void;
}

function HealthBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="font-mono text-[11px] text-ink-quaternary">—</span>;
  const color = score >= 80 ? '#6B8E5A' : score >= 60 ? '#C68B3D' : '#B85843';
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[11px]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {score}
    </span>
  );
}

export function PRDListTable({
  items,
  total,
  currentStatus,
  currentSearch,
  onFilterChange,
  onSearchChange,
}: PRDListTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(currentSearch);
  const [, startTransition] = useTransition();

  const handleSearchInput = useCallback(
    (value: string) => {
      setSearchValue(value);
      const timeout = setTimeout(() => {
        startTransition(() => {
          onSearchChange(value);
        });
      }, 300);
      return () => clearTimeout(timeout);
    },
    [onSearchChange],
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-md flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">
          My PRDs{' '}
          <span className="font-mono text-sm font-normal text-ink-tertiary">
            &middot; {total} documents
          </span>
        </h1>
      </div>

      {/* Filters + Search */}
      <div className="mb-md flex items-center justify-between gap-md">
        <div className="flex gap-xs">
          {STATUS_FILTERS.map((f) => (
            <Chip
              key={f.value}
              active={currentStatus === f.value}
              onClick={() => onFilterChange(f.value)}
            >
              {f.label}
            </Chip>
          ))}
        </div>

        <div className="relative w-64">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary"
          />
          <Input
            placeholder="Search PRDs..."
            value={searchValue}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div className="py-xl text-center">
          <p className="text-sm text-ink-secondary">No PRDs match your filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-subtle">
                <th className="py-2 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                  Name
                </th>
                <th className="py-2 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                  Status
                </th>
                <th className="py-2 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                  Owner
                </th>
                <th className="py-2 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                  Health
                </th>
                <th className="py-2 text-left font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                  Updated
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {items.map((prd) => (
                <tr
                  key={prd.id}
                  onClick={() => router.push(`/prds/${prd.id}`)}
                  className="group h-row cursor-pointer border-b border-subtle transition-colors hover:bg-bg-surface"
                >
                  <td className="py-2 pr-4">
                    <p className="text-sm font-medium text-ink-primary">{prd.title}</p>
                    {prd.project_tag && (
                      <p className="font-mono text-[11px] text-ink-tertiary">{prd.project_tag}</p>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <Pill status={prd.status as Parameters<typeof Pill>[0]['status']} />
                  </td>
                  <td className="py-2 pr-4">
                    {prd.owner && (
                      <div className="flex items-center gap-xs">
                        <Avatar name={prd.owner.full_name ?? 'User'} size="sm" />
                        <span className="text-sm text-ink-secondary">
                          {prd.owner.full_name ?? 'Unknown'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <HealthBadge score={prd.health_score} />
                  </td>
                  <td className="py-2 pr-4">
                    <span className="font-mono text-[11px] text-ink-tertiary">
                      {formatDistanceToNow(new Date(prd.updated_at), { addSuffix: true })}
                    </span>
                  </td>
                  <td className="py-2">
                    <button
                      className="invisible text-ink-tertiary transition-colors hover:text-ink-primary group-hover:visible"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
