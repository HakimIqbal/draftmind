'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { PRDListTable } from '@/components/dashboard/prd-list-table';
import type { PRDListItem } from '@/lib/db/queries/prd';

interface PRDListPageClientProps {
  items: PRDListItem[];
  total: number;
  currentStatus: string;
  currentSearch: string;
}

export function PRDListPageClient({
  items,
  total,
  currentStatus,
  currentSearch,
}: PRDListPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`/prds?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="p-lg">
      <PRDListTable
        items={items}
        total={total}
        currentStatus={currentStatus}
        currentSearch={currentSearch}
        onFilterChange={(status) => updateParams({ status: status === 'all' ? '' : status })}
        onSearchChange={(q) => updateParams({ q })}
      />
    </div>
  );
}
