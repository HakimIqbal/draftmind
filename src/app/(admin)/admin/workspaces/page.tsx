import { createAdminClient } from '@/lib/supabase/admin';
import { WorkspacesClient } from './workspaces-client';

export const metadata = { title: 'Admin — DraftMind' };
export const dynamic = 'force-dynamic';

export default async function AdminWorkspacesPage() {
  const admin = createAdminClient();

  const { data: workspaces } = await admin
    .from('workspaces')
    .select('id, name, slug, owner_id, industry, team_size, created_at, icon_custom_url')
    .order('created_at', { ascending: false });

  const { data: memberCounts } = await admin.from('workspace_members').select('workspace_id');
  const countMap: Record<string, number> = {};
  (memberCounts ?? []).forEach((m) => {
    countMap[m.workspace_id] = (countMap[m.workspace_id] || 0) + 1;
  });

  const { data: prdCounts } = await admin.from('prds').select('workspace_id');
  const prdMap: Record<string, number> = {};
  (prdCounts ?? []).forEach((p) => {
    prdMap[p.workspace_id] = (prdMap[p.workspace_id] || 0) + 1;
  });

  const ownerIds = [...new Set((workspaces ?? []).map((w) => w.owner_id))];
  const { data: owners } = await admin
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .in('id', ownerIds);
  const ownerMap: Record<
    string,
    { full_name: string | null; email: string; avatar_url: string | null }
  > = {};
  (owners ?? []).forEach((o) => {
    ownerMap[o.id] = { full_name: o.full_name, email: o.email, avatar_url: o.avatar_url };
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">Workspaces</h1>
        <p className="mt-0.5 text-[13px] text-[#888]">{(workspaces ?? []).length} workspaces</p>
      </div>

      <WorkspacesClient
        workspaces={workspaces ?? []}
        countMap={countMap}
        prdMap={prdMap}
        ownerMap={ownerMap}
      />
    </div>
  );
}
