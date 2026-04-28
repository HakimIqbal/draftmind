import { createClient } from '@/lib/supabase/server';

export async function getProvidersByWorkspace(workspaceId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('providers')
    .select(
      'id, type, display_name, base_url, default_model, available_models, is_default, status, status_reason, last_used_at, created_at',
    )
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function getDefaultProvider(workspaceId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('providers')
    .select('id, type, display_name, default_model')
    .eq('workspace_id', workspaceId)
    .eq('is_default', true)
    .single();
  return data;
}
