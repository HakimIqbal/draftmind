import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';
import { ProvidersList, type ProviderRow } from '@/components/settings/providers-list';

export const metadata = {
  title: 'DraftMind',
};

export default async function ProviderSettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Fetch the user's primary workspace
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  const workspaceId = membership?.workspace_id ?? '';

  // Fetch providers for this workspace
  let providers: ProviderRow[] = [];
  if (workspaceId) {
    const { data } = await supabase
      .from('providers')
      .select('id, provider_type, display_name, status, is_default, model, base_url')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    providers = (data ?? []) as ProviderRow[];
  }

  return <ProvidersList providers={providers} workspaceId={workspaceId} />;
}
