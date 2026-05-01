import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { getPRDsByWorkspace } from '@/lib/db/queries/prd';
import { redirect } from 'next/navigation';
import { PRDPipelineBoard } from '@/components/dashboard/prd-pipeline-board';

export default async function PrdPipelinePage() {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect('/dashboard');

  const { items } = await getPRDsByWorkspace(workspace.id, {}, 200);

  const columns = {
    draft: items.filter((p) => p.status === 'draft'),
    in_review: items.filter((p) => ['in_review', 'reviewed'].includes(p.status)),
    refined: items.filter((p) => p.status === 'refined'),
    final: items.filter((p) => p.status === 'final'),
  };

  return <PRDPipelineBoard columns={columns} />;
}
