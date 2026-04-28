'use server';

import { createClient } from '@/lib/supabase/server';

interface CreateWorkspaceInput {
  name: string;
  slug: string;
  icon_pattern: string;
  is_private: boolean;
  industry: string | null;
  team_size: string | null;
}

export async function createWorkspace(input: CreateWorkspaceInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated' };
  }

  // Insert workspace
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({
      name: input.name,
      slug: input.slug,
      icon_pattern: input.icon_pattern,
      is_private: input.is_private,
      owner_id: user.id,
      industry: input.industry,
      team_size: input.team_size,
    })
    .select('id')
    .single();

  if (wsError) {
    return { error: wsError.message };
  }

  // Insert workspace member as admin
  const { error: memberError } = await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: 'admin',
  });

  if (memberError) {
    return { error: memberError.message };
  }

  return { workspace_id: workspace.id };
}
