'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PRDListTable } from '@/components/dashboard/prd-list-table';
import type { PRDListItem } from '@/lib/db/queries/prd';

interface PRDListPageClientProps {
  items: PRDListItem[];
  total: number;
  currentStatus: string;
  currentSearch: string;
  workspaceId: string;
}

export function PRDListPageClient({
  items,
  total,
  currentStatus,
  currentSearch,
  workspaceId,
}: PRDListPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('prds-list-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prds', filter: `workspace_id=eq.${workspaceId}` },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, router]);

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
