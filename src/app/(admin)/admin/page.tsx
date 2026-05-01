import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { Users, Building2, FileText, Sparkles, ArrowUpRight, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';

export const metadata = { title: 'Admin — DraftMind' };

export default async function AdminOverviewPage() {
  const admin = createAdminClient();

  const [usersR, wsR, prdsR, aiR, recentUsersR, recentActivityR] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('workspaces').select('*', { count: 'exact', head: true }),
    admin.from('prds').select('*', { count: 'exact', head: true }),
    admin.from('ai_runs').select('*', { count: 'exact', head: true }),
    admin
      .from('profiles')
      .select('id, full_name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    admin
      .from('activity_log')
      .select('id, type, actor_id, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const actorIds = [
    ...new Set((recentActivityR.data ?? []).map((a) => a.actor_id).filter(Boolean)),
  ];
  const { data: actors } = await admin.from('profiles').select('id, full_name').in('id', actorIds);
  const actorMap = new Map((actors ?? []).map((a) => [a.id, a]));

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

      {/* Two columns */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="rounded-xl border border-[#eee] bg-white">
          <div className="flex items-center justify-between border-b border-[#f0f0f0] px-5 py-4">
            <h2 className="text-[14px] font-semibold text-[#1a1a1a]">Recent Users</h2>
            <Link href="/admin/users" className="text-[12px] text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#f5f5f5]">
            {(recentUsersR.data ?? []).map((u) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={u.full_name ?? 'User'} size="sm" />
                  <div>
                    <p className="text-[13px] font-medium text-[#1a1a1a]">
                      {u.full_name ?? 'No name'}
                    </p>
                    <p className="text-[11px] text-[#aaa]">{u.email}</p>
                  </div>
                </div>
                <span className="text-[11px] text-[#bbb]">
                  {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
            {(recentUsersR.data ?? []).length === 0 && (
              <div className="px-5 py-8 text-center text-[13px] text-[#aaa]">No users yet</div>
            )}
          </div>
        </div>

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
                  <span className="text-[11px] text-[#bbb]">
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
      </div>
    </div>
  );
}
