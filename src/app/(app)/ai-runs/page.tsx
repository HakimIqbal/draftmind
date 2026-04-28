import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AiRunHistoryTable } from '@/components/audit/ai-run-history-table';

export default async function AiRunHistoryPage() {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect('/onboarding/step-3');

  const supabase = await createClient();

  const { data: runs } = await supabase
    .from('ai_runs')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return <AiRunHistoryTable runs={runs ?? []} />;
}
