import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export interface CurrentWorkspace {
  id: string;
  name: string;
  slug: string;
  icon_pattern: string;
  is_private: boolean;
  owner_id: string;
  currentRole: string;
}

export async function getCurrentWorkspace(userId: string): Promise<CurrentWorkspace | null> {
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get('current_workspace_id')?.value;
  const supabase = await createClient();

  if (workspaceId) {
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (member) {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id, name, slug, icon_pattern, is_private, owner_id')
        .eq('id', workspaceId)
        .single();

      if (workspace) {
        return { ...workspace, currentRole: member.role };
      }
    }
  }

  // Fallback: first workspace user is a member of
  const { data: firstMember } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single();

  if (firstMember) {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name, slug, icon_pattern, is_private, owner_id')
      .eq('id', firstMember.workspace_id)
      .single();

    if (workspace) {
      return { ...workspace, currentRole: firstMember.role };
    }
  }

  return null;
}

export interface WorkspaceListItem {
  id: string;
  name: string;
  slug: string;
  icon_pattern: string;
  icon_custom_url: string | null;
  role: string;
}

export async function getUserWorkspaces(userId: string): Promise<WorkspaceListItem[]> {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true });

  if (!members || members.length === 0) return [];

  const wsIds = members.map((m) => m.workspace_id);
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, slug, icon_pattern, icon_custom_url')
    .in('id', wsIds);

  if (!workspaces) return [];

  return members.map((m) => {
    const ws = workspaces.find((w) => w.id === m.workspace_id);
    return {
      id: ws?.id ?? m.workspace_id,
      name: ws?.name ?? 'Unknown',
      slug: ws?.slug ?? '',
      icon_pattern: ws?.icon_pattern ?? 'circle',
      icon_custom_url: ws?.icon_custom_url ?? null,
      role: m.role,
    };
  });
}

export async function getWorkspaceMemberCount(workspaceId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  return count ?? 0;
}
