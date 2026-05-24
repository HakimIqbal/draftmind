import { requireUser } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { ClientRedirect } from '@/components/auth/client-redirect';
import { WorkspaceNewClient } from './workspace-new-client';

export default async function WorkspaceNewPage() {
  const user = await requireUser();

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (membership?.workspace_id) {
    return <ClientRedirect to="/dashboard" />;
  }

  return <WorkspaceNewClient />;
}
