import { createAdminClient } from '@/lib/supabase/admin';
import { Building2, Users, FileText } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';

export const metadata = { title: 'Admin — DraftMind' };

export default async function AdminWorkspacesPage() {
  const admin = createAdminClient();

  const { data: workspaces } = await admin
    .from('workspaces')
    .select('id, name, slug, owner_id, industry, team_size, created_at')
    .order('created_at', { ascending: false });

  const { data: memberCounts } = await admin.from('workspace_members').select('workspace_id');
  const countMap: Record<string, number> = {};
  (memberCounts ?? []).forEach((m) => {
    countMap[m.workspace_id] = (countMap[m.workspace_id] || 0) + 1;
  });

  const { data: prdCounts } = await admin
    .from('prds')
    .select('workspace_id')
    .is('archived_at', null);
  const prdMap: Record<string, number> = {};
  (prdCounts ?? []).forEach((p) => {
    prdMap[p.workspace_id] = (prdMap[p.workspace_id] || 0) + 1;
  });

  const ownerIds = [...new Set((workspaces ?? []).map((w) => w.owner_id))];
  const { data: owners } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .in('id', ownerIds);
  const ownerMap = new Map((owners ?? []).map((o) => [o.id, o]));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">Workspaces</h1>
        <p className="mt-0.5 text-[13px] text-[#888]">{(workspaces ?? []).length} workspaces</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(workspaces ?? []).map((ws) => {
          const owner = ownerMap.get(ws.owner_id);
          return (
            <div
              key={ws.id}
              className="rounded-xl border border-[#eee] bg-white p-5 transition-all hover:border-[#ddd] hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                  <Building2 size={18} className="text-violet-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[#1a1a1a]">{ws.name}</p>
                  <p className="text-[11px] text-[#aaa]">{ws.slug}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-4">
                <div className="flex items-center gap-1.5 text-[12px] text-[#888]">
                  <Users size={12} />
                  {countMap[ws.id] ?? 0} members
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-[#888]">
                  <FileText size={12} />
                  {prdMap[ws.id] ?? 0} PRDs
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-[#f5f5f5] pt-3">
                <Avatar name={owner?.full_name ?? 'User'} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] text-[#888]">
                    {owner?.full_name ?? owner?.email ?? 'Unknown'}
                  </p>
                  <p className="text-[10px] text-[#bbb]">
                    {new Date(ws.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
