'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { Search, LayoutGrid, List, Kanban } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Chip } from '@/components/ui/chip';
import { Pill } from '@/components/ui/pill';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils/cn';
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

function HealthDot({ score }: { score: number | null }) {
  if (score === null) return <span className="text-[12px] text-[#ccc]">—</span>;
  const color = score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-[#666]">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {score}
    </span>
  );
}

interface PRDListTableProps {
  items: PRDListItem[];
  total: number;
  currentStatus: string;
  currentSearch: string;
  onFilterChange: (status: string) => void;
  onSearchChange: (search: string) => void;
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a1a1a]">My PRDs</h1>
          <p className="mt-0.5 text-[13px] text-[#888]">
            {total} document{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/prds/pipeline"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#e5e5e3] bg-white px-3 text-[12px] font-medium text-[#666] transition-colors hover:border-[#ddd] hover:text-[#1a1a1a]"
          >
            <Kanban size={13} />
            Pipeline
          </Link>
          <div className="flex rounded-lg border border-[#e5e5e3]">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex h-8 w-8 items-center justify-center transition-colors',
                viewMode === 'list'
                  ? 'bg-[#f5f5f4] text-[#1a1a1a]'
                  : 'text-[#bbb] hover:text-[#666]',
              )}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex h-8 w-8 items-center justify-center transition-colors',
                viewMode === 'grid'
                  ? 'bg-[#f5f5f4] text-[#1a1a1a]'
                  : 'text-[#bbb] hover:text-[#666]',
              )}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
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
        <div className="relative w-56 shrink-0">
          <Search
            size={13}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]"
          />
          <input
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="focus:ring-accent/30 h-8 w-full rounded-lg border border-[#e5e5e3] bg-white pl-8 pr-3 text-[12px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
          />
        </div>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[13px] text-[#aaa]">No PRDs match your filter.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="overflow-hidden rounded-xl border border-[#eee]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f0f0] bg-[#fafaf9]">
                <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  Name
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  Owner
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  Health
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((prd) => (
                <tr
                  key={prd.id}
                  onClick={() => router.push(`/prds/${prd.id}`)}
                  className="cursor-pointer border-b border-[#f5f5f5] transition-colors hover:bg-[#fafaf9]"
                >
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] font-medium text-[#1a1a1a]">{prd.title}</p>
                    {prd.project_tag && (
                      <p className="text-[11px] text-[#aaa]">{prd.project_tag}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <Pill status={prd.status as Parameters<typeof Pill>[0]['status']} />
                  </td>
                  <td className="px-5 py-3.5">
                    {prd.owner && (
                      <div className="flex items-center gap-2">
                        <Avatar name={prd.owner.full_name ?? 'User'} size="sm" />
                        <span className="text-[12px] text-[#888]">
                          {prd.owner.full_name ?? 'Unknown'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <HealthDot score={prd.health_score} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[12px] text-[#bbb]">
                      {formatDistanceToNow(new Date(prd.updated_at), { addSuffix: true })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((prd) => (
            <Link
              key={prd.id}
              href={`/prds/${prd.id}`}
              className="flex flex-col rounded-xl border border-[#eee] bg-white p-5 transition-all hover:border-[#ddd] hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <Pill status={prd.status as Parameters<typeof Pill>[0]['status']} />
                <HealthDot score={prd.health_score} />
              </div>
              <h3 className="mt-3 text-[13px] font-medium text-[#1a1a1a]">{prd.title}</h3>
              {prd.project_tag && (
                <p className="mt-0.5 text-[11px] text-[#aaa]">{prd.project_tag}</p>
              )}
              <div className="mt-auto flex items-center justify-between pt-4">
                {prd.owner && (
                  <div className="flex items-center gap-2">
                    <Avatar name={prd.owner.full_name ?? 'User'} size="sm" />
                    <span className="text-[11px] text-[#888]">{prd.owner.full_name}</span>
                  </div>
                )}
                <span className="text-[11px] text-[#bbb]">
                  {formatDistanceToNow(new Date(prd.updated_at), { addSuffix: true })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
