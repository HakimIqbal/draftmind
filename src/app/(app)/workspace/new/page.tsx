import { requireUser } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WorkspaceNewClient } from './workspace-new-client';

export default async function WorkspaceNewPage() {
  const user = await requireUser();

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (membership?.workspace_id) {
    redirect('/dashboard');
  }

  return <WorkspaceNewClient />;
}
