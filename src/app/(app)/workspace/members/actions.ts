'use server';

import { revalidatePath } from 'next/cache';
import { requireWorkspaceRole } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';

export async function inviteMember(
  workspaceId: string,
  email: string,
  role: 'admin' | 'editor' | 'commenter' | 'viewer',
) {
  const { user } = await requireWorkspaceRole(workspaceId, ['admin']);
  const supabase = await createClient();

  // Generate a unique invitation token
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

  const { error } = await supabase.from('workspace_invitations').insert({
    workspace_id: workspaceId,
    email: email.toLowerCase().trim(),
    role,
    invited_by: user.id,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/workspace/members');
  return { success: true };
}

export async function changeRole(
  workspaceId: string,
  userId: string,
  newRole: 'admin' | 'editor' | 'commenter' | 'viewer',
) {
  await requireWorkspaceRole(workspaceId, ['admin']);
  const supabase = await createClient();

  const { error } = await supabase
    .from('workspace_members')
    .update({ role: newRole })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/workspace/members');
  return { success: true };
}

export async function removeMember(workspaceId: string, userId: string) {
  await requireWorkspaceRole(workspaceId, ['admin']);
  const supabase = await createClient();

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/workspace/members');
  return { success: true };
}

export async function resendInvitation(workspaceId: string, invitationId: string) {
  await requireWorkspaceRole(workspaceId, ['admin']);
  const supabase = await createClient();

  // Extend expiry by 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await supabase
    .from('workspace_invitations')
    .update({ expires_at: expiresAt.toISOString() })
    .eq('id', invitationId)
    .eq('workspace_id', workspaceId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/workspace/members');
  return { success: true };
}

export async function revokeInvitation(workspaceId: string, invitationId: string) {
  await requireWorkspaceRole(workspaceId, ['admin']);
  const supabase = await createClient();

  const { error } = await supabase
    .from('workspace_invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', invitationId)
    .eq('workspace_id', workspaceId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/workspace/members');
  return { success: true };
}
