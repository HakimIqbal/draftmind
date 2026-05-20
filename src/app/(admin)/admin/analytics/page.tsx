import { createAdminClient } from '@/lib/supabase/admin';
import { Users, Building2, FileText, Sparkles, TrendingUp } from 'lucide-react';
import { AnalyticsPoller } from './analytics-poller';

export const metadata = { title: 'Admin — DraftMind' };
export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const admin = createAdminClient();

  const [usersR, wsR, prdsR, aiR, newUsersR, prdsByStatusR, runsByTypeR] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact' }).limit(1),
    admin.from('workspaces').select('id', { count: 'exact' }).limit(1),
    admin.from('prds').select('id', { count: 'exact' }).limit(1),
    admin.from('ai_runs').select('id', { count: 'exact' }).limit(1),
    admin
      .from('profiles')
      .select('id')
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    admin.from('prds').select('status'),
    admin.from('ai_runs').select('type'),
  ]);

  const statusCounts: Record<string, number> = {};
  (prdsByStatusR.data ?? []).forEach((p) => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });

  const typeCounts: Record<string, number> = {};
  (runsByTypeR.data ?? []).forEach((r) => {
    typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
  });

  const statuses = ['draft', 'in_review', 'reviewed', 'refined', 'approved', 'final'];
  const runTypes = ['generate_prd', 'ai_review', 'refine_section', 'inline_suggest'];

  return (
    <div>
      <AnalyticsPoller />
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">Analytics</h1>
        <p className="mt-0.5 text-[13px] text-[#888]">System-wide usage and metrics</p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          {
            label: 'Users',
            value: usersR.count ?? 0,
            icon: Users,
            bg: 'bg-blue-50',
            color: 'text-blue-500',
          },
          {
            label: 'Workspaces',
            value: wsR.count ?? 0,
            icon: Building2,
            bg: 'bg-violet-50',
            color: 'text-violet-500',
          },
          {
            label: 'PRDs',
            value: prdsR.count ?? 0,
            icon: FileText,
            bg: 'bg-emerald-50',
            color: 'text-emerald-500',
          },
          {
            label: 'AI Runs',
            value: aiR.count ?? 0,
            icon: Sparkles,
            bg: 'bg-amber-50',
            color: 'text-amber-500',
          },
          {
            label: 'New (7d)',
            value: newUsersR.data?.length ?? 0,
            icon: TrendingUp,
            bg: 'bg-rose-50',
            color: 'text-rose-500',
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#eee] bg-white p-4">
            <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
              <s.icon size={15} className={s.color} />
            </div>
            <p className="text-[22px] font-bold text-[#1a1a1a]">{s.value}</p>
            <p className="text-[11px] text-[#999]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#eee] bg-white">
          <div className="border-b border-[#f0f0f0] px-5 py-4">
            <h2 className="text-[14px] font-semibold text-[#1a1a1a]">PRDs by Status</h2>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {statuses.map((status) => {
                const count = statusCounts[status] ?? 0;
                const total = prdsByStatusR.data?.length ?? 1;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="w-24 text-[12px] capitalize text-[#666]">
                      {status.replace('_', ' ')}
                    </span>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-[#f5f5f4]">
                        <div
                          className="bg-accent/60 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-8 text-right font-mono text-[12px] text-[#999]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#eee] bg-white">
          <div className="border-b border-[#f0f0f0] px-5 py-4">
            <h2 className="text-[14px] font-semibold text-[#1a1a1a]">AI Runs by Type</h2>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {runTypes.map((type) => {
                const count = typeCounts[type] ?? 0;
                const total = runsByTypeR.data?.length ?? 1;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="w-28 text-[12px] text-[#666]">{type.replace(/_/g, ' ')}</span>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-[#f5f5f4]">
                        <div
                          className="h-2 rounded-full bg-blue-400/60 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-8 text-right font-mono text-[12px] text-[#999]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
