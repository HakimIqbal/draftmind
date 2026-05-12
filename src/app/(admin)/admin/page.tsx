import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  Users,
  Building2,
  FileText,
  Sparkles,
  ArrowUpRight,
  Activity,
  ShieldCheck,
  Zap,
  Server,
  AlertTriangle,
  Trophy,
  Eye,
  Database,
  UserCheck,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import { fetchLangSmithRuns, isLangSmithEnabled } from '@/lib/ai/langsmith';

export const metadata = { title: 'Admin — DraftMind' };
export const revalidate = 60; // Cache dashboard data for 60 seconds

function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function safeResult<T>(result: PromiseSettledResult<T>, fallback: unknown): T {
  if (result.status === 'fulfilled') return result.value;
  console.error('[admin] query failed:', result.reason);
  return fallback as T;
}

export default async function AdminOverviewPage() {
  const admin = createAdminClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

  // LangSmith — has internal 3s timeout + 10-min cache
  const langSmithPromise = fetchLangSmithRuns(10);

  // ALL profiles for actor/owner resolution (small table, one query instead of multiple)
  const allProfilesPromise = admin
    .from('profiles')
    .select('id, full_name, email, created_at, last_active_at, avatar_url');

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Single parallel batch — all queries at once; allSettled keeps dashboard alive on partial failure
  const results = await Promise.allSettled([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('workspaces').select('*', { count: 'exact', head: true }),
    admin.from('prds').select('*', { count: 'exact', head: true }),
    admin.from('ai_runs').select('*', { count: 'exact', head: true }),
    allProfilesPromise,
    admin
      .from('activity_log')
      .select('id, type, actor_id, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    admin
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .eq('level', 'error')
      .gte('created_at', todayStart),
    admin
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart),
    admin
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .eq('level', 'warn')
      .gte('created_at', twentyFourHoursAgo),
    admin.from('ai_runs').select('total_tokens').gte('created_at', todayStart),
    admin.from('ai_runs').select('total_tokens').gte('created_at', weekStart),
    admin
      .from('providers')
      .select(
        'id, display_name, status, total_requests, avg_latency_ms, successful_requests, failed_requests',
      )
      .order('priority', { ascending: true }),
    admin
      .from('prds')
      .select('id, title, health_score, owner_id')
      .not('health_score', 'is', null)
      .order('health_score', { ascending: false })
      .limit(5),
    admin
      .from('system_logs')
      .select('id, source, message, created_at')
      .eq('level', 'error')
      .order('created_at', { ascending: false })
      .limit(3),
    admin.from('activity_log').select('actor_id').gte('created_at', todayStart),
    langSmithPromise,
  ]);

  // usersR count:null (vs 0 when DB is up) is the signal used by sysDbOk to detect DB failure
  const usersR = safeResult(results[0], { data: null, count: null, error: null });
  const wsR = safeResult(results[1], { data: null, count: null, error: null });
  const prdsR = safeResult(results[2], { data: null, count: null, error: null });
  const aiR = safeResult(results[3], { data: null, count: null, error: null });
  const allProfilesR = safeResult(results[4], { data: null, error: null });
  const recentActivityR = safeResult(results[5], { data: null, error: null });
  const errorsR = safeResult(results[6], { data: null, count: null, error: null });
  const logsR = safeResult(results[7], { data: null, count: null, error: null });
  const warnsR = safeResult(results[8], { data: null, count: null, error: null });
  const aiTodayR = safeResult(results[9], { data: null, error: null });
  const aiWeekR = safeResult(results[10], { data: null, error: null });
  const providersR = safeResult(results[11], { data: null, error: null });
  const topPrdsR = safeResult(results[12], { data: null, error: null });
  const recentErrorsR = safeResult(results[13], { data: null, error: null });
  const activeUsersR = safeResult(results[14], { data: null, error: null });
  // LangSmith fallback: total_runs: 0 hides the section when call fails
  const langSmithR = safeResult(results[15], {
    runs: [],
    summary: {
      total_runs: 0,
      success_count: 0,
      error_count: 0,
      avg_latency_ms: null as number | null,
      total_tokens: 0,
    },
  });

  // Build profile lookup map from single query (replaces 3 sequential queries)
  const allProfiles = allProfilesR.data ?? [];
  const profileMap = new Map(allProfiles.map((p) => [p.id, p]));
  const recentUsersR = {
    data: [...allProfiles]
      .sort((a, b) =>
        (b.last_active_at ?? b.created_at).localeCompare(a.last_active_at ?? a.created_at),
      )
      .slice(0, 5),
  };
  const actorMap = profileMap;
  const ownerMap = profileMap;

  // System Health — derived from same queries, no extra DB calls
  const sysDbOk = usersR.count !== null && !usersR.error;
  const sysActiveProviders = (providersR.data ?? []).filter(
    (p: { status: string }) => p.status === 'active',
  ).length;
  const sysErrors24h = errorsR.count ?? 0;
  const sysWarns24h = warnsR.count ?? 0;
  const sysActiveUsersToday = new Set(
    (activeUsersR.data ?? []).map((a: { actor_id: string }) => a.actor_id),
  ).size;

  // Calculate system health
  const errorCount = errorsR.count ?? 0;
  const totalLogs = logsR.count ?? 0;
  const errorRate = totalLogs > 0 ? (errorCount / totalLogs) * 100 : 0;
  const healthStatus = errorRate < 5 ? 'healthy' : errorRate < 15 ? 'warning' : 'critical';
  const healthColor =
    healthStatus === 'healthy'
      ? 'bg-emerald-500'
      : healthStatus === 'warning'
        ? 'bg-amber-500'
        : 'bg-red-500';
  const healthLabel =
    healthStatus === 'healthy' ? 'Healthy' : healthStatus === 'warning' ? 'Warning' : 'Critical';

  // Calculate AI usage
  const tokensToday = (aiTodayR.data ?? []).reduce((sum, r) => sum + (r.total_tokens ?? 0), 0);
  const tokensWeek = (aiWeekR.data ?? []).reduce((sum, r) => sum + (r.total_tokens ?? 0), 0);
  const runsToday = aiTodayR.data?.length ?? 0;
  const runsWeek = aiWeekR.data?.length ?? 0;

  const stats = [
    {
      label: 'Users',
      value: usersR.count ?? 0,
      icon: Users,
      href: '/admin/users',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Workspaces',
      value: wsR.count ?? 0,
      icon: Building2,
      href: '/admin/workspaces',
      bg: 'bg-violet-50',
      iconColor: 'text-violet-500',
    },
    {
      label: 'PRDs',
      value: prdsR.count ?? 0,
      icon: FileText,
      href: '/admin/prds',
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'AI Runs',
      value: aiR.count ?? 0,
      icon: Sparkles,
      href: '/admin/ai-runs',
      bg: 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">Overview</h1>
        <p className="mt-0.5 text-[13px] text-[#888]">System summary</p>
      </div>

      {/* System Health Strip */}
      <div className="mb-6 rounded-xl border border-[#e8e8e8] bg-[#fafafa] p-4">
        <div className="mb-2 flex items-center gap-1.5">
          <Database size={12} className="text-[#999]" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#999]">
            System Health
          </span>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${sysDbOk ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <div>
              <p className="font-mono text-[10px] text-[#999]">Database</p>
              <p className="text-[13px] font-medium text-[#1a1a1a]">
                {sysDbOk ? 'Connected' : 'Error'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${sysActiveProviders !== null && sysActiveProviders > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}
            />
            <div>
              <p className="font-mono text-[10px] text-[#999]">AI Providers</p>
              <p className="text-[13px] font-medium text-[#1a1a1a]">
                {sysActiveProviders !== null ? `${sysActiveProviders} active` : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${sysErrors24h !== null && sysErrors24h === 0 ? 'bg-emerald-500' : sysErrors24h !== null && sysErrors24h <= 5 ? 'bg-amber-500' : 'bg-red-500'}`}
            />
            <div>
              <p className="font-mono text-[10px] text-[#999]">Errors (24h)</p>
              <p className="text-[13px] font-medium text-[#1a1a1a]">
                {sysErrors24h !== null ? sysErrors24h : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${sysWarns24h !== null && sysWarns24h === 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}
            />
            <div>
              <p className="font-mono text-[10px] text-[#999]">Warnings (24h)</p>
              <p className="text-[13px] font-medium text-[#1a1a1a]">
                {sysWarns24h !== null ? sysWarns24h : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck size={14} className="text-[#999]" />
            <div>
              <p className="font-mono text-[10px] text-[#999]">Active Today</p>
              <p className="text-[13px] font-medium text-[#1a1a1a]">
                {sysActiveUsersToday !== null ? `${sysActiveUsersToday} users` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <div className="rounded-xl border border-[#eee] bg-white p-5 transition-all group-hover:border-[#ddd] group-hover:shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
                  <s.icon size={18} className={s.iconColor} />
                </div>
                <ArrowUpRight
                  size={14}
                  className="text-[#ddd] transition-colors group-hover:text-[#999]"
                />
              </div>
              <p className="mt-4 text-[28px] font-bold text-[#1a1a1a]">{s.value}</p>
              <p className="mt-0.5 text-[12px] text-[#888]">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* System Health + AI Usage */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* System Health */}
        <div className="rounded-xl border border-[#eee] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#999]" />
            <h2 className="text-[14px] font-semibold text-[#1a1a1a]">System Health</h2>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-white ${healthColor}`}
            >
              {healthLabel}
            </span>
            <span className="text-[12px] text-[#888]">
              {errorCount} errors / {totalLogs} logs (24h)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#f0f0f0]">
            <div
              className={`h-2 rounded-full transition-all ${healthColor}`}
              style={{ width: `${Math.min(100, 100 - errorRate)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-[#aaa]">Error rate: {errorRate.toFixed(1)}%</p>
        </div>

        {/* AI Usage */}
        <div className="rounded-xl border border-[#eee] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Zap size={16} className="text-[#999]" />
            <h2 className="text-[14px] font-semibold text-[#1a1a1a]">AI Usage</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase text-[#aaa]">Today</p>
              <p className="mt-1 text-[24px] font-bold text-[#1a1a1a]">
                {formatTokenCount(tokensToday)}
              </p>
              <p className="text-[11px] text-[#bbb]">{runsToday} runs</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase text-[#aaa]">This Week</p>
              <p className="mt-1 text-[24px] font-bold text-[#1a1a1a]">
                {formatTokenCount(tokensWeek)}
              </p>
              <p className="text-[11px] text-[#bbb]">{runsWeek} runs</p>
            </div>
          </div>
        </div>
      </div>

      {/* LangSmith Observability */}
      {isLangSmithEnabled() && langSmithR.summary.total_runs > 0 && (
        <div className="mt-6 rounded-xl border border-[#eee] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-[#999]" />
              <h2 className="text-[14px] font-semibold text-[#1a1a1a]">LangSmith Observability</h2>
            </div>
            <a
              href={`https://smith.langchain.com/o/default/projects/p/${process.env.LANGCHAIN_PROJECT ?? 'draftmind'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[12px] text-accent hover:underline"
            >
              Open Dashboard <ArrowUpRight size={12} />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <div>
              <p className="text-[11px] font-medium uppercase text-[#aaa]">Traced Runs</p>
              <p className="mt-1 text-[20px] font-bold text-[#1a1a1a]">
                {langSmithR.summary.total_runs}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase text-[#aaa]">Success</p>
              <p className="mt-1 text-[20px] font-bold text-emerald-600">
                {langSmithR.summary.success_count}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase text-[#aaa]">Errors</p>
              <p className="mt-1 text-[20px] font-bold text-red-500">
                {langSmithR.summary.error_count}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase text-[#aaa]">Avg Latency</p>
              <p className="mt-1 text-[20px] font-bold text-[#1a1a1a]">
                {langSmithR.summary.avg_latency_ms
                  ? `${(langSmithR.summary.avg_latency_ms / 1000).toFixed(1)}s`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase text-[#aaa]">Tokens</p>
              <p className="mt-1 text-[20px] font-bold text-[#1a1a1a]">
                {formatTokenCount(langSmithR.summary.total_tokens)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Provider Status */}
      {(providersR.data ?? []).length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Server size={16} className="text-[#999]" />
            <h2 className="text-[14px] font-semibold text-[#1a1a1a]">Provider Status</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {(providersR.data ?? []).map((p) => (
              <div key={p.id} className="rounded-xl border border-[#eee] bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="truncate text-[13px] font-medium text-[#1a1a1a]">
                    {p.display_name}
                  </p>
                  <span
                    className={`h-2 w-2 rounded-full ${p.status === 'active' ? 'bg-emerald-500' : 'bg-red-400'}`}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#aaa]">Requests</span>
                    <span className="text-[#555]">{p.total_requests ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#aaa]">Avg Latency</span>
                    <span className="text-[#555]">
                      {p.avg_latency_ms ? `${Math.round(p.avg_latency_ms)}ms` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#aaa]">Success</span>
                    <span className="text-[#555]">
                      {p.total_requests
                        ? `${Math.round(((p.successful_requests ?? 0) / p.total_requests) * 100)}%`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top PRDs + Recent Users */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top 5 PRDs by Health */}
        <div className="rounded-xl border border-[#eee] bg-white">
          <div className="flex items-center justify-between border-b border-[#f0f0f0] px-5 py-4">
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-amber-500" />
              <h2 className="text-[14px] font-semibold text-[#1a1a1a]">Top PRDs by Health</h2>
            </div>
            <Link href="/admin/prds" className="text-[12px] text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#f5f5f5]">
            {(topPrdsR.data ?? []).map((prd, i) => {
              const owner = ownerMap.get(prd.owner_id ?? '');
              const score = prd.health_score ?? 0;
              const scoreColor =
                score >= 80
                  ? 'bg-emerald-100 text-emerald-700'
                  : score >= 50
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700';
              return (
                <div key={prd.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f5f5f4] text-[11px] font-bold text-[#999]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-[#1a1a1a]">{prd.title}</p>
                    <p className="text-[11px] text-[#bbb]">{owner?.full_name ?? 'Unknown'}</p>
                  </div>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${scoreColor}`}>
                    {score}
                  </span>
                </div>
              );
            })}
            {(topPrdsR.data ?? []).length === 0 && (
              <div className="px-5 py-8 text-center text-[13px] text-[#aaa]">
                No PRDs with health scores yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="rounded-xl border border-[#eee] bg-white">
          <div className="flex items-center justify-between border-b border-[#f0f0f0] px-5 py-4">
            <h2 className="text-[14px] font-semibold text-[#1a1a1a]">Recently Active</h2>
            <Link href="/admin/users" className="text-[12px] text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#f5f5f5]">
            {(recentUsersR.data ?? []).map((u) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={u.full_name ?? 'User'} size="sm" avatarUrl={u.avatar_url} />
                  <div>
                    <p className="text-[13px] font-medium text-[#1a1a1a]">
                      {u.full_name ?? 'No name'}
                    </p>
                    <p className="text-[11px] text-[#aaa]">{u.email}</p>
                  </div>
                </div>
                <span className="text-[11px] text-[#bbb]" suppressHydrationWarning>
                  {formatDistanceToNow(new Date(u.last_active_at ?? u.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            ))}
            {(recentUsersR.data ?? []).length === 0 && (
              <div className="px-5 py-8 text-center text-[13px] text-[#aaa]">No users yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity + Recent Errors */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-xl border border-[#eee] bg-white">
          <div className="flex items-center justify-between border-b border-[#f0f0f0] px-5 py-4">
            <h2 className="text-[14px] font-semibold text-[#1a1a1a]">Recent Activity</h2>
            <Link href="/admin/activity" className="text-[12px] text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#f5f5f5]">
            {(recentActivityR.data ?? []).map((a) => {
              const actor = actorMap.get(a.actor_id ?? '');
              return (
                <div key={a.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f5f5f4]">
                      <Activity size={12} className="text-[#999]" />
                    </div>
                    <p className="text-[13px] text-[#555]">
                      <span className="font-medium text-[#1a1a1a]">
                        {actor?.full_name ?? 'System'}
                      </span>{' '}
                      {a.type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className="text-[11px] text-[#bbb]" suppressHydrationWarning>
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </span>
                </div>
              );
            })}
            {(recentActivityR.data ?? []).length === 0 && (
              <div className="px-5 py-8 text-center text-[13px] text-[#aaa]">No activity yet</div>
            )}
          </div>
        </div>

        {/* Recent Errors */}
        <div className="rounded-xl border border-[#eee] bg-white">
          <div className="flex items-center justify-between border-b border-[#f0f0f0] px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" />
              <h2 className="text-[14px] font-semibold text-[#1a1a1a]">Recent Errors</h2>
            </div>
            <Link href="/admin/system-logs" className="text-[12px] text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#f5f5f5]">
            {(recentErrorsR.data ?? []).map((e) => (
              <div key={e.id} className="px-5 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                    {e.source}
                  </span>
                  <span className="text-[11px] text-[#bbb]" suppressHydrationWarning>
                    {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="truncate text-[12px] text-[#555]">{e.message}</p>
              </div>
            ))}
            {(recentErrorsR.data ?? []).length === 0 && (
              <div className="px-5 py-8 text-center text-[13px] text-[#aaa]">
                No errors — system is clean
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
