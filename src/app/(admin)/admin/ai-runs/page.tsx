import { createAdminClient } from '@/lib/supabase/admin';
import { formatDistanceToNow } from 'date-fns';
import { fetchLangSmithRuns, isLangSmithEnabled, getLangSmithProject } from '@/lib/ai/langsmith';
import { ArrowUpRight } from 'lucide-react';

export const metadata = { title: 'AI Runs — Admin — DraftMind' };
export const revalidate = 60;

function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default async function AdminAIRunsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const admin = createAdminClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

  const [runsResult, aiTodayR, aiWeekR, langSmith] = await Promise.all([
    admin
      .from('ai_runs')
      .select(
        'id, type, status, model_used, prompt_tokens, completion_tokens, total_tokens, duration_ms, error_message, workspace_id, created_at',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1),
    admin.from('ai_runs').select('total_tokens, duration_ms, status').gte('created_at', todayStart),
    admin.from('ai_runs').select('total_tokens, duration_ms, status').gte('created_at', weekStart),
    fetchLangSmithRuns(50).catch(() => ({
      runs: [],
      summary: {
        total_runs: 0,
        success_count: 0,
        error_count: 0,
        avg_latency_ms: 0,
        total_tokens: 0,
      },
    })),
  ]);

  const runs = runsResult.data ?? [];
  const totalPages = Math.ceil((runsResult.count ?? 0) / pageSize);
  const wsIds = [...new Set(runs.map((r) => r.workspace_id).filter(Boolean))];
  const { data: workspaces } = await admin.from('workspaces').select('id, name').in('id', wsIds);
  const wsMap = new Map((workspaces ?? []).map((w) => [w.id, w]));

  const lsEnabled = isLangSmithEnabled();
  const lsProject = getLangSmithProject();

  // Internal stats
  const todayRuns = aiTodayR.data ?? [];
  const weekRuns = aiWeekR.data ?? [];
  const tokensToday = todayRuns.reduce((s, r) => s + (r.total_tokens ?? 0), 0);
  const tokensWeek = weekRuns.reduce((s, r) => s + (r.total_tokens ?? 0), 0);
  const errorsToday = todayRuns.filter((r) => r.status === 'error').length;
  const avgLatencyToday =
    todayRuns.length > 0
      ? Math.round(todayRuns.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / todayRuns.length)
      : 0;

  // LangSmith breakdown by operation
  const lsByName = new Map<
    string,
    { count: number; errors: number; totalLatency: number; totalTokens: number }
  >();
  if (lsEnabled) {
    for (const run of langSmith.runs) {
      const existing = lsByName.get(run.name) ?? {
        count: 0,
        errors: 0,
        totalLatency: 0,
        totalTokens: 0,
      };
      existing.count++;
      if (run.status === 'error') existing.errors++;
      existing.totalLatency += run.latency_ms ?? 0;
      existing.totalTokens += run.total_tokens ?? 0;
      lsByName.set(run.name, existing);
    }
  }

  // Internal breakdown by type
  const byType = new Map<
    string,
    { count: number; errors: number; totalLatency: number; totalTokens: number }
  >();
  for (const run of runs) {
    const t = run.type ?? 'unknown';
    const existing = byType.get(t) ?? { count: 0, errors: 0, totalLatency: 0, totalTokens: 0 };
    existing.count++;
    if (run.status === 'error') existing.errors++;
    existing.totalLatency += run.duration_ms ?? 0;
    existing.totalTokens +=
      run.total_tokens ?? (run.prompt_tokens ?? 0) + (run.completion_tokens ?? 0);
    byType.set(t, existing);
  }

  const lsSummary = langSmith.summary;
  const successRate =
    lsSummary.total_runs > 0
      ? Math.round((lsSummary.success_count / lsSummary.total_runs) * 100)
      : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a1a1a]">AI Runs</h1>
          <p className="mt-0.5 text-[13px] text-[#888]">Usage, performance & observability</p>
        </div>
        {lsEnabled && (
          <a
            href={`https://smith.langchain.com/o/default/projects/p/${lsProject}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-[#eee] bg-white px-4 py-2 text-[12px] font-medium text-[#555] transition-colors hover:border-[#ddd] hover:text-[#1a1a1a]"
          >
            Open LangSmith <ArrowUpRight size={13} />
          </a>
        )}
      </div>

      {/* Summary: Internal Stats */}
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        <div className="rounded-xl border border-[#eee] bg-white p-4">
          <p className="text-[11px] font-medium uppercase text-[#aaa]">Today</p>
          <p className="mt-1 text-[24px] font-bold text-[#1a1a1a]">{todayRuns.length}</p>
          <p className="text-[11px] text-[#bbb]">runs</p>
        </div>
        <div className="rounded-xl border border-[#eee] bg-white p-4">
          <p className="text-[11px] font-medium uppercase text-[#aaa]">This Week</p>
          <p className="mt-1 text-[24px] font-bold text-[#1a1a1a]">{weekRuns.length}</p>
          <p className="text-[11px] text-[#bbb]">runs</p>
        </div>
        <div className="rounded-xl border border-[#eee] bg-white p-4">
          <p className="text-[11px] font-medium uppercase text-[#aaa]">Tokens Today</p>
          <p className="mt-1 text-[24px] font-bold text-[#1a1a1a]">
            {formatTokenCount(tokensToday)}
          </p>
          <p className="text-[11px] text-[#bbb]">{formatTokenCount(tokensWeek)} this week</p>
        </div>
        <div className="rounded-xl border border-[#eee] bg-white p-4">
          <p className="text-[11px] font-medium uppercase text-[#aaa]">Avg Latency</p>
          <p className="mt-1 text-[24px] font-bold text-[#1a1a1a]">
            {avgLatencyToday ? `${(avgLatencyToday / 1000).toFixed(1)}s` : '-'}
          </p>
          <p className="text-[11px] text-[#bbb]">today</p>
        </div>
        <div className="rounded-xl border border-[#eee] bg-white p-4">
          <p className="text-[11px] font-medium uppercase text-[#aaa]">Errors Today</p>
          <p
            className={`mt-1 text-[24px] font-bold ${errorsToday > 0 ? 'text-red-500' : 'text-[#1a1a1a]'}`}
          >
            {errorsToday}
          </p>
          <p className="text-[11px] text-[#bbb]">
            {todayRuns.length > 0
              ? `${Math.round(((todayRuns.length - errorsToday) / todayRuns.length) * 100)}% success`
              : '-'}
          </p>
        </div>
        <div className="rounded-xl border border-[#eee] bg-white p-4">
          <p className="text-[11px] font-medium uppercase text-[#aaa]">Total</p>
          <p className="mt-1 text-[24px] font-bold text-[#1a1a1a]">{runsResult.count ?? 0}</p>
          <p className="text-[11px] text-[#bbb]">all time</p>
        </div>
      </div>

      {/* LangSmith Observability */}
      {lsEnabled && lsSummary.total_runs > 0 && (
        <div className="mt-6 rounded-xl border border-[#eee] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[#1a1a1a]">LangSmith Observability</h2>
            <div className="flex items-center gap-3 text-[11px] text-[#aaa]">
              <span>{lsSummary.total_runs} traced</span>
              <span className="text-emerald-600">{successRate}% success</span>
              <span>{formatTokenCount(lsSummary.total_tokens)} tokens</span>
            </div>
          </div>

          {/* Breakdown by Operation */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from(lsByName.entries()).map(([name, stats]) => {
              const avgLatency = stats.count > 0 ? Math.round(stats.totalLatency / stats.count) : 0;
              const opSuccessRate =
                stats.count > 0
                  ? Math.round(((stats.count - stats.errors) / stats.count) * 100)
                  : 0;
              return (
                <div key={name} className="rounded-lg border border-[#f0f0f0] bg-[#fafaf9] p-3.5">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-[#555] shadow-sm">
                      {name}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${opSuccessRate >= 90 ? 'text-emerald-600' : opSuccessRate >= 70 ? 'text-amber-500' : 'text-red-500'}`}
                    >
                      {opSuccessRate}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#aaa]">Runs</span>
                      <span className="font-medium text-[#555]">{stats.count}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#aaa]">Errors</span>
                      <span
                        className={`font-medium ${stats.errors > 0 ? 'text-red-500' : 'text-[#555]'}`}
                      >
                        {stats.errors}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#aaa]">Avg Latency</span>
                      <span className="font-medium text-[#555]">
                        {avgLatency ? `${(avgLatency / 1000).toFixed(1)}s` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#aaa]">Tokens</span>
                      <span className="font-medium text-[#555]">
                        {formatTokenCount(stats.totalTokens)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Breakdown by Type (Internal) */}
      {byType.size > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-[14px] font-semibold text-[#1a1a1a]">Breakdown by Type</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from(byType.entries()).map(([type, stats]) => {
              const avgLatency = stats.count > 0 ? Math.round(stats.totalLatency / stats.count) : 0;
              return (
                <div key={type} className="rounded-xl border border-[#eee] bg-white p-4">
                  <p className="text-[13px] font-medium capitalize text-[#1a1a1a]">
                    {type.replace(/_/g, ' ')}
                  </p>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#aaa]">Runs</span>
                      <span className="font-medium text-[#555]">{stats.count}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#aaa]">Errors</span>
                      <span
                        className={`font-medium ${stats.errors > 0 ? 'text-red-500' : 'text-[#555]'}`}
                      >
                        {stats.errors}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#aaa]">Avg Latency</span>
                      <span className="font-medium text-[#555]">
                        {avgLatency ? `${(avgLatency / 1000).toFixed(1)}s` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#aaa]">Tokens</span>
                      <span className="font-medium text-[#555]">
                        {formatTokenCount(stats.totalTokens)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Runs Table */}
      <div className="mt-6">
        <h2 className="mb-3 text-[14px] font-semibold text-[#1a1a1a]">Recent Runs</h2>
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
              {runs.map((run) => {
                const statusColor =
                  run.status === 'success'
                    ? 'bg-emerald-400'
                    : run.status === 'error'
                      ? 'bg-red-400'
                      : 'bg-amber-400';
                const tokens =
                  run.total_tokens ?? (run.prompt_tokens ?? 0) + (run.completion_tokens ?? 0);
                return (
                  <tr
                    key={run.id}
                    className="border-b border-[#f5f5f5] transition-colors hover:bg-[#fafaf9]"
                  >
                    <td className="px-5 py-3.5">
                      <span className="rounded-md bg-[#f5f5f4] px-2 py-0.5 text-[11px] font-medium text-[#666]">
                        {(run.type ?? '').replace(/_/g, ' ')}
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
                        {run.model_used ?? '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] text-[#888]" suppressHydrationWarning>
                        {tokens ? tokens.toLocaleString() : '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] text-[#888]">
                        {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] text-[#888]">
                        {wsMap.get(run.workspace_id)?.name ?? '-'}
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
              {runs.length === 0 && (
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
