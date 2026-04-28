import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ActivityLog } from '@/components/audit/activity-log';

export default async function AuditLogPage() {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect('/onboarding/step-3');

  const supabase = await createClient();

  const { data: entries } = await supabase
    .from('activity_log')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return <ActivityLog entries={entries ?? []} />;
}
