import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AiRunHistoryTable } from '@/components/audit/ai-run-history-table';

export default async function AiRunHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect('/dashboard');

  const supabase = await createClient();

  const { data: runs, count } = await supabase
    .from('ai_runs')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  return (
    <div>
      <AiRunHistoryTable runs={runs ?? []} />

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 px-8 pb-6">
          {page > 1 ? (
            <a
              href={`?page=${page - 1}`}
              className="rounded-lg border border-[#eee] px-3 py-1.5 text-[12px] font-medium text-[#666] hover:bg-[#f5f5f4]"
            >
              &larr; Prev
            </a>
          ) : (
            <span className="rounded-lg border border-[#f5f5f4] px-3 py-1.5 text-[12px] text-[#ccc]">
              &larr; Prev
            </span>
          )}
          <span className="font-mono text-[11px] text-[#999]">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <a
              href={`?page=${page + 1}`}
              className="rounded-lg border border-[#eee] px-3 py-1.5 text-[12px] font-medium text-[#666] hover:bg-[#f5f5f4]"
            >
              Next &rarr;
            </a>
          ) : (
            <span className="rounded-lg border border-[#f5f5f4] px-3 py-1.5 text-[12px] text-[#ccc]">
              Next &rarr;
            </span>
          )}
        </div>
      )}
    </div>
  );
}
