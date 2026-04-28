import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { getPRDsByWorkspace, getPRDCountByWorkspace } from '@/lib/db/queries/prd';
import { redirect } from 'next/navigation';
import { PRDListPageClient } from './client';

interface Props {
  searchParams: Promise<{ status?: string; q?: string; sort?: string }>;
}

export default async function PRDListPage({ searchParams }: Props) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect('/onboarding/step-3');

  const wsId = workspace.id as string;
  const params = await searchParams;
  const status = params.status ?? 'all';
  const search = params.q ?? '';
  const sort = params.sort ?? 'updated_at';

  const totalCount = await getPRDCountByWorkspace(wsId);

  // If workspace has 0 PRDs, show empty state
  if (totalCount === 0) {
    const { EmptyState } = await import('@/components/dashboard/empty-state');
    return <EmptyState />;
  }

  const { items, total } = await getPRDsByWorkspace(wsId, { status, search, sort });

  return (
    <PRDListPageClient items={items} total={total} currentStatus={status} currentSearch={search} />
  );
}
