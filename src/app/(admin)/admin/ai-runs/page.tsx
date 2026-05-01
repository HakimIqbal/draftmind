import { createAdminClient } from '@/lib/supabase/admin';
import { formatDistanceToNow } from 'date-fns';

export const metadata = { title: 'Admin — DraftMind' };

export default async function AdminAIRunsPage() {
  const admin = createAdminClient();

  const { data: runs } = await admin
    .from('ai_runs')
    .select(
      'id, run_type, status, model_used, prompt_tokens, completion_tokens, duration_ms, workspace_id, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(100);

  const wsIds = [...new Set((runs ?? []).map((r) => r.workspace_id).filter(Boolean))];
  const { data: workspaces } = await admin.from('workspaces').select('id, name').in('id', wsIds);
  const wsMap = new Map((workspaces ?? []).map((w) => [w.id, w]));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">AI Runs</h1>
        <p className="mt-0.5 text-[13px] text-[#888]">Latest 100 AI executions</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#eee]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f0f0f0] bg-[#fafaf9]">
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Type
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Status
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Model
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Tokens
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Duration
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Workspace
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {(runs ?? []).map((run) => {
              const statusColor =
                run.status === 'success'
                  ? 'bg-emerald-400'
                  : run.status === 'error'
                    ? 'bg-red-400'
                    : 'bg-amber-400';
              return (
                <tr
                  key={run.id}
                  className="border-b border-[#f5f5f5] transition-colors hover:bg-[#fafaf9]"
                >
                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-[#f5f5f4] px-2 py-0.5 text-[11px] font-medium text-[#666]">
                      {run.run_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />
                      <span className="text-[12px] text-[#666]">{run.status}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-[11px] text-[#888]">
                      {run.model_used ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-[11px] text-[#888]">
                      {((run.prompt_tokens ?? 0) + (run.completion_tokens ?? 0)).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-[11px] text-[#888]">
                      {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[12px] text-[#888]">
                      {wsMap.get(run.workspace_id)?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[11px] text-[#aaa]">
                      {formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                    </span>
                  </td>
                </tr>
              );
            })}
            {(runs ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-[13px] text-[#aaa]">
                  No AI runs yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
