import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createClient } from '@/lib/supabase/server';
import { getPRDsByWorkspace, getPRDCountByWorkspace } from '@/lib/db/queries/prd';
import { redirect } from 'next/navigation';
import { PRDListPageClient } from './client';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ status?: string; q?: string; sort?: string }>;
}

export default async function PRDListPage({ searchParams }: Props) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect('/dashboard');

  const wsId = workspace.id as string;
  const params = await searchParams;
  const status = params.status ?? 'all';
  const search = params.q ?? '';
  const sort = params.sort ?? 'updated_at';

  const totalCount = await getPRDCountByWorkspace(wsId);

  // If workspace has 0 PRDs, show empty state
  if (totalCount === 0) {
    const supabase = await createClient();
    const { count: templateCount } = await supabase
      .from('prd_templates')
      .select('*', { count: 'exact', head: true })
      .eq('is_built_in', true);
    const { EmptyState } = await import('@/components/dashboard/empty-state');
    return <EmptyState templateCount={templateCount ?? 0} />;
  }

  const { items, total } = await getPRDsByWorkspace(wsId, { status, search, sort });

  return (
    <PRDListPageClient
      items={items}
      total={total}
      currentStatus={status}
      currentSearch={search}
      workspaceId={wsId}
    />
  );
}
