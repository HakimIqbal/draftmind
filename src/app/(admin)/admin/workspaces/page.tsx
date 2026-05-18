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

  const workspaceIds = (workspaces ?? []).map((w) => w.id);

  const [memberCountResults, prdCountResults] = await Promise.all([
    Promise.all(
      workspaceIds.map((id) =>
        admin
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', id)
          .then(({ count }) => ({ id, count: count ?? 0 })),
      ),
    ),
    Promise.all(
      workspaceIds.map((id) =>
        admin
          .from('prds')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', id)
          .then(({ count }) => ({ id, count: count ?? 0 })),
      ),
    ),
  ]);

  const countMap: Record<string, number> = {};
  memberCountResults.forEach((r) => {
    countMap[r.id] = r.count;
  });

  const prdMap: Record<string, number> = {};
  prdCountResults.forEach((r) => {
    prdMap[r.id] = r.count;
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
