'use server';

import { cookies } from 'next/headers';
import { requireUser, requireWorkspaceMember, requireWorkspaceRole } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { logError } from '@/lib/logging/system-log';
import { logActivity } from '@/lib/logging/activity-log';
import {
  clearCurrentWorkspaceCookieIfMatches,
  setCurrentWorkspaceCookie,
} from '@/lib/workspace/current-workspace-cookie';

export async function getWorkspaceActivity(workspaceId: string) {
  await requireWorkspaceMember(workspaceId);
  const admin = createAdminClient();

  const { data: activities } = await admin
    .from('activity_log')
    .select('id, type, actor_id, resource_type, resource_id, metadata, created_at')
    .eq('workspace_id', workspaceId)
    .not('type', 'in', '(login,logout)')
    .order('created_at', { ascending: false })
    .limit(50);

  const actorIds = [...new Set((activities ?? []).map((a) => a.actor_id).filter(Boolean))];
  let actorMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
  if (actorIds.length > 0) {
    const { data: actors } = await admin
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', actorIds);
    actorMap = Object.fromEntries((actors ?? []).map((a) => [a.id, a]));
  }

  return { activities: activities ?? [], actorMap };
}

export async function getWorkspaceSettings() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!membership) return null;

  const { data: ws } = await supabase
    .from('workspaces')
    .select('id, name, slug, industry, team_size, owner_id')
    .eq('id', membership.workspace_id)
    .single();

  if (!ws) return null;

  return {
    ...ws,
    currentRole: membership.role as string,
    isOwner: ws.owner_id === user.id,
  } as {
    id: string;
    name: string;
    slug: string;
    industry: string | null;
    team_size: string | null;
    owner_id: string;
    currentRole: string;
    isOwner: boolean;
  };
}

export async function updateWorkspaceSettings(
  workspaceId: string,
  data: { name?: string; industry?: string; team_size?: string },
) {
  const { user } = await requireWorkspaceRole(workspaceId, ['admin']);
  const admin = createAdminClient();

  const updates: Record<string, string> = {};
  if (data.name?.trim()) updates.name = data.name.trim();
  if (data.industry !== undefined) updates.industry = data.industry;
  if (data.team_size !== undefined) updates.team_size = data.team_size;

  if (Object.keys(updates).length === 0) return { error: 'Nothing to update' };

  const { error } = await admin.from('workspaces').update(updates).eq('id', workspaceId);

  if (error) {
    logError('workspace.settings', error.message, { workspaceId });
    return { error: 'Failed to update workspace' };
  }

  await logActivity({
    workspaceId,
    actorId: user.id,
    type: 'workspace_settings_changed',
    resourceType: 'workspace',
    resourceId: workspaceId,
    metadata: updates,
  });

  revalidatePath('/workspace/settings');
  revalidatePath('/dashboard');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function createWorkspace(data: {
  name: string;
  industry?: string;
  team_size?: string;
}) {
  const user = await requireUser();

  // Use admin client to bypass RLS — user can't SELECT new workspace before being a member
  const admin = createAdminClient();

  const slug =
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Date.now().toString(36);

  const { data: ws, error } = await admin
    .from('workspaces')
    .insert({
      name: data.name.trim(),
      slug,
      owner_id: user.id,
      industry: data.industry || null,
      team_size: data.team_size || null,
    })
    .select('id')
    .single();

  if (error || !ws) {
    logError('workspace.create', error?.message ?? 'Unknown', {});
    return { error: 'Failed to create workspace' };
  }

  // Add creator as admin member
  await admin.from('workspace_members').insert({
    workspace_id: ws.id,
    user_id: user.id,
    role: 'admin',
  });

  await logActivity({
    workspaceId: ws.id,
    actorId: user.id,
    type: 'workspace_created',
    resourceType: 'workspace',
    resourceId: ws.id,
    metadata: { name: data.name.trim() },
  });

  const cookieStore = await cookies();
  setCurrentWorkspaceCookie(cookieStore, ws.id);

  revalidatePath('/');
  return { success: true, workspaceId: ws.id };
}

export async function leaveWorkspace(workspaceId: string) {
  const { user } = await requireWorkspaceMember(workspaceId);
  const admin = createAdminClient();

  // Check user is not the owner
  const { data: ws } = await admin
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single();

  if (ws?.owner_id === user.id) {
    return { error: 'Owner cannot leave workspace. Transfer ownership first.' };
  }

  const { error } = await admin
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id);

  if (error) {
    logError('workspace.leave', error.message, { workspaceId });
    return { error: 'Failed to leave workspace' };
  }

  const cookieStore = await cookies();
  clearCurrentWorkspaceCookieIfMatches(cookieStore, workspaceId);

  await logActivity({
    workspaceId,
    actorId: user.id,
    type: 'workspace_left',
    resourceType: 'workspace',
    resourceId: workspaceId,
  });

  revalidatePath('/');
  return { success: true };
}

export async function deleteWorkspace(workspaceId: string) {
  const user = await requireUser();
  const admin = createAdminClient();

  // Only owner can delete
  const { data: ws } = await admin
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single();

  if (!ws || ws.owner_id !== user.id) {
    return { error: 'Only the workspace owner can delete it' };
  }

  const cookieStore = await cookies();
  clearCurrentWorkspaceCookieIfMatches(cookieStore, workspaceId);

  await logActivity({
    workspaceId,
    actorId: user.id,
    type: 'workspace_deleted',
    resourceType: 'workspace',
    resourceId: workspaceId,
  });

  const { error } = await admin.from('workspaces').delete().eq('id', workspaceId);

  if (error) {
    logError('workspace.delete', error.message, { workspaceId });
    return { error: 'Failed to delete workspace' };
  }

  revalidatePath('/');
  return { success: true };
}

export async function transferOwnership(workspaceId: string, newOwnerId: string) {
  const user = await requireUser();
  const admin = createAdminClient();

  // Only current owner can transfer
  const { data: ws } = await admin
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single();

  if (!ws || ws.owner_id !== user.id) {
    return { error: 'Only the workspace owner can transfer ownership' };
  }

  // Verify new owner is a member
  const { data: member } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', newOwnerId)
    .single();

  if (!member) {
    return { error: 'New owner must be a workspace member' };
  }

  // Transfer
  const { error } = await admin
    .from('workspaces')
    .update({ owner_id: newOwnerId })
    .eq('id', workspaceId);

  if (error) {
    logError('workspace.transfer', error.message, { workspaceId });
    return { error: 'Failed to transfer ownership' };
  }

  // Make new owner admin
  await admin
    .from('workspace_members')
    .update({ role: 'admin' })
    .eq('workspace_id', workspaceId)
    .eq('user_id', newOwnerId);

  await logActivity({
    workspaceId,
    actorId: user.id,
    type: 'workspace_ownership_transferred',
    resourceType: 'workspace',
    resourceId: workspaceId,
    metadata: { new_owner_id: newOwnerId },
  });

  revalidatePath('/workspace/settings');
  return { success: true };
}
