import { createAdminClient } from '@/lib/supabase/admin';
import { Pill } from '@/components/ui/pill';
import { formatDistanceToNow } from 'date-fns';

export const metadata = { title: 'Admin — DraftMind' };
export const dynamic = 'force-dynamic';

export default async function AdminPRDsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const admin = createAdminClient();

  const { data: prds, count } = await admin
    .from('prds')
    .select('id, title, status, health_score, owner_id, workspace_id, created_at, updated_at', {
      count: 'exact',
    })
    .order('updated_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  const totalPages = Math.ceil((count ?? 0) / pageSize);

  const ownerIds = [...new Set((prds ?? []).map((p) => p.owner_id))];
  const wsIds = [...new Set((prds ?? []).map((p) => p.workspace_id))];
  const { data: owners } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .in('id', ownerIds);
  const { data: workspaces } = await admin.from('workspaces').select('id, name').in('id', wsIds);
  const ownerMap = new Map((owners ?? []).map((o) => [o.id, o]));
  const wsMap = new Map((workspaces ?? []).map((w) => [w.id, w]));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">All PRDs</h1>
        <p className="mt-0.5 text-[13px] text-[#888]">
          {count ?? 0} documents across all workspaces
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#eee]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f0f0f0] bg-[#fafaf9]">
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Title
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Status
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Health
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Owner
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Workspace
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {(prds ?? []).map((prd) => {
              const owner = ownerMap.get(prd.owner_id);
              const ws = wsMap.get(prd.workspace_id);
              return (
                <tr
                  key={prd.id}
                  className="border-b border-[#f5f5f5] transition-colors hover:bg-[#fafaf9]"
                >
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] font-medium text-[#1a1a1a]">
                      {prd.title ?? 'Untitled'}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <Pill status={prd.status as Parameters<typeof Pill>[0]['status']} />
                  </td>
                  <td className="px-5 py-3.5">
                    {prd.health_score ? (
                      <span className="font-mono text-[12px] text-[#666]">{prd.health_score}%</span>
                    ) : (
                      <span className="text-[12px] text-[#ccc]">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[12px] text-[#888]">
                      {owner?.full_name ?? owner?.email ?? '-'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[12px] text-[#888]">{ws?.name ?? '-'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[12px] text-[#aaa]">
                      {formatDistanceToNow(new Date(prd.updated_at), { addSuffix: true })}
                    </span>
                  </td>
                </tr>
              );
            })}
            {(prds ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-[13px] text-[#aaa]">
                  No PRDs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
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
