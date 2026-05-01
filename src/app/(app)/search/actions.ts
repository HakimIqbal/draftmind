'use server';

import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createClient } from '@/lib/supabase/server';

export async function searchPRDs(query: string) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from('prds')
    .select('id, title, status, project_tag, updated_at')
    .eq('workspace_id', workspace.id)
    .ilike('title', `%${query}%`)
    .is('archived_at', null)
    .order('updated_at', { ascending: false })
    .limit(20);

  return (data ?? []) as {
    id: string;
    title: string;
    status: string;
    project_tag: string | null;
    updated_at: string;
  }[];
}
