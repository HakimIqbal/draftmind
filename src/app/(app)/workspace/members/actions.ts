'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requireUser, requireWorkspaceRole } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { logError, logInfo } from '@/lib/logging/system-log';
import { logActivity } from '@/lib/logging/activity-log';
import { sendNotification } from '@/lib/notifications/send';
import { setCurrentWorkspaceCookie } from '@/lib/workspace/current-workspace-cookie';

export async function getInvitableUsers(workspaceId: string) {
  await requireWorkspaceRole(workspaceId, ['admin']);

  // Use admin client to bypass RLS — need to see ALL registered users
  const admin = createAdminClient();

  // Get current member IDs to exclude
  const { data: currentMembers } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId);

  const memberIds = (currentMembers ?? []).map((m) => m.user_id);

  // Query non-members directly from DB (avoid fetching ALL users then filtering in JS)
  let query = admin
    .from('profiles')
    .select('id, full_name, email, role_self_reported, avatar_color_seed, avatar_url')
    .eq('is_super_admin', false)
    .order('full_name', { ascending: true });

  if (memberIds.length > 0) {
    query = query.not('id', 'in', `(${memberIds.join(',')})`);
  }

  const { data: invitableUsers } = await query;

  return (invitableUsers ?? []).map((u) => ({
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    role_self_reported: u.role_self_reported,
    avatar_color_seed: u.avatar_color_seed,
    avatar_url: u.avatar_url,
  }));
}

export async function inviteMember(
  workspaceId: string,
  email: string,
  role: 'admin' | 'editor' | 'commenter' | 'viewer',
) {
  const { user } = await requireWorkspaceRole(workspaceId, ['admin']);
  const admin = createAdminClient();

  // Generate a unique invitation token
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

  const { error } = await admin.from('workspace_invitations').insert({
    workspace_id: workspaceId,
    email: email.toLowerCase().trim(),
    role,
    invited_by: user.id,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    logError('workspace.members', error.message, { workspaceId });
    return { success: false, error: 'Operation failed. Please try again.' };
  }

  // Get invitation ID for the action URL
  const { data: invitation } = await admin
    .from('workspace_invitations')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('email', email.toLowerCase().trim())
    .eq('token', token)
    .single();

  // Fetch workspace name + inviter name in parallel
  const [{ data: workspace }, { data: profile }] = await Promise.all([
    admin.from('workspaces').select('name').eq('id', workspaceId).single(),
    admin.from('profiles').select('full_name').eq('id', user.id).single(),
  ]);

  const inviterName = profile?.full_name ?? 'A team member';
  const wsName = workspace?.name ?? 'a workspace';

  // Send notification — use admin client to find invited user
  // (user-scoped client can't see profiles of non-workspace-members due to RLS)
  const { data: invitedUser } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (invitedUser) {
    await admin.from('notifications').insert({
      recipient_id: invitedUser.id,
      workspace_id: workspaceId,
      type: 'workspace_invite',
      title: `You're invited to ${wsName}`,
      body: `${inviterName} invited you as ${role}. Click to accept or reject.`,
      action_url: `/invite/${invitation?.id ?? token}`,
    });
  }

  await logActivity({
    workspaceId,
    actorId: user.id,
    type: 'member_invited',
    resourceType: 'workspace',
    resourceId: workspaceId,
    metadata: { email: email.toLowerCase().trim(), role },
  });
  logInfo(
    'workspace.members',
    `Invitation sent to: ${email.toLowerCase().trim()}`,
    { workspaceId, role },
    user.id,
  );

  revalidatePath('/workspace/members');
  return { success: true };
}

export async function changeRole(
  workspaceId: string,
  userId: string,
  newRole: 'admin' | 'editor' | 'commenter' | 'viewer',
) {
  const { user } = await requireWorkspaceRole(workspaceId, ['admin']);
  const admin = createAdminClient();

  const { data: ws } = await admin
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single();

  if (ws?.owner_id === userId && newRole !== 'admin') {
    return { success: false, error: 'Workspace owner must remain an admin.' };
  }

  const { error } = await admin
    .from('workspace_members')
    .update({ role: newRole })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) {
    logError('workspace.members', error.message, { workspaceId });
    return { success: false, error: 'Operation failed. Please try again.' };
  }

  await logActivity({
    workspaceId,
    actorId: user.id,
    type: 'member_role_changed',
    resourceType: 'user',
    resourceId: userId,
    metadata: { new_role: newRole },
  });

  revalidatePath('/workspace/members');
  return { success: true };
}

export async function removeMember(workspaceId: string, userId: string) {
  const { user } = await requireWorkspaceRole(workspaceId, ['admin']);
  const admin = createAdminClient();

  const { data: ws } = await admin
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single();

  if (ws?.owner_id === userId) {
    return { success: false, error: 'Workspace owner cannot be removed.' };
  }

  const { error } = await admin
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) {
    logError('workspace.members', error.message, { workspaceId });
    return { success: false, error: 'Operation failed. Please try again.' };
  }

  await logActivity({
    workspaceId,
    actorId: user.id,
    type: 'member_removed',
    resourceType: 'user',
    resourceId: userId,
  });

  // Notify removed member (skip if self-remove)
  if (userId !== user.id) {
    const { data: wsInfo } = await admin
      .from('workspaces')
      .select('name')
      .eq('id', workspaceId)
      .single();
    const wsName = wsInfo?.name ?? 'a workspace';

    await admin.from('notifications').insert({
      recipient_id: userId,
      workspace_id: workspaceId,
      type: 'member_removed',
      title: `You've been removed from ${wsName}`,
      body: `Your access to "${wsName}" workspace has been revoked by an admin.`,
      action_url: '/dashboard',
    });
  }

  revalidatePath('/workspace/members');
  return { success: true };
}

export async function resendInvitation(workspaceId: string, invitationId: string) {
  const { user } = await requireWorkspaceRole(workspaceId, ['admin']);
  const admin = createAdminClient();

  // Extend expiry by 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await admin
    .from('workspace_invitations')
    .update({ expires_at: expiresAt.toISOString() })
    .eq('id', invitationId)
    .eq('workspace_id', workspaceId);

  if (error) {
    logError('workspace.members', error.message, { workspaceId });
    return { success: false, error: 'Operation failed. Please try again.' };
  }

  await logActivity({
    workspaceId,
    actorId: user.id,
    type: 'member_invited',
    resourceType: 'workspace',
    resourceId: invitationId,
    metadata: { action: 'resent' },
  });

  revalidatePath('/workspace/members');
  return { success: true };
}

export async function revokeInvitation(workspaceId: string, invitationId: string) {
  const { user } = await requireWorkspaceRole(workspaceId, ['admin']);
  const admin = createAdminClient();

  const { error } = await admin
    .from('workspace_invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', invitationId)
    .eq('workspace_id', workspaceId);

  if (error) {
    logError('workspace.members', error.message, { workspaceId });
    return { success: false, error: 'Operation failed. Please try again.' };
  }

  await logActivity({
    workspaceId,
    actorId: user.id,
    type: 'member_invitation_revoked',
    resourceType: 'workspace',
    resourceId: invitationId,
  });

  revalidatePath('/workspace/members');
  return { success: true };
}

export async function acceptInvitation(invitationId: string) {
  const user = await requireUser();
  const admin = createAdminClient();

  // Get invitation
  const { data: invitation } = await admin
    .from('workspace_invitations')
    .select('id, workspace_id, email, role, expires_at, accepted_at, revoked_at')
    .eq('id', invitationId)
    .single();

  if (!invitation) return { error: 'Invitation not found' };
  if (invitation.accepted_at) return { error: 'Invitation already accepted' };
  if (invitation.revoked_at) return { error: 'Invitation has been revoked' };
  if (new Date(invitation.expires_at) < new Date()) return { error: 'Invitation has expired' };

  // Verify the invitation is for this user
  const { data: profile } = await admin.from('profiles').select('email').eq('id', user.id).single();
  if (!profile || profile.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return { error: 'This invitation is not for you' };
  }

  // Check not already a member
  const { data: existing } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', invitation.workspace_id)
    .eq('user_id', user.id)
    .single();

  if (existing) return { error: 'You are already a member of this workspace' };

  // Accept: add to workspace + update invitation
  await Promise.all([
    admin.from('workspace_members').insert({
      workspace_id: invitation.workspace_id,
      user_id: user.id,
      role: invitation.role,
      joined_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    }),
    admin
      .from('workspace_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitationId),
  ]);

  await logActivity({
    workspaceId: invitation.workspace_id,
    actorId: user.id,
    type: 'member_joined',
    resourceType: 'workspace',
    resourceId: invitation.workspace_id,
  });

  const cookieStore = await cookies();
  setCurrentWorkspaceCookie(cookieStore, invitation.workspace_id);

  // Notify workspace admins that a new member joined
  const { data: joinerProfile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
  const joinerName = joinerProfile?.full_name ?? 'Someone';
  const { data: wsInfo } = await admin
    .from('workspaces')
    .select('name')
    .eq('id', invitation.workspace_id)
    .single();
  const wsName = wsInfo?.name ?? 'the workspace';

  logInfo(
    'workspace.members',
    `Member joined: ${joinerName} → ${wsName}`,
    { workspaceId: invitation.workspace_id },
    user.id,
  );

  const { data: admins } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', invitation.workspace_id)
    .eq('role', 'admin');

  if (admins) {
    for (const a of admins) {
      if (a.user_id === user.id) continue;
      sendNotification({
        recipientId: a.user_id,
        workspaceId: invitation.workspace_id,
        type: 'member_joined',
        title: 'New member joined',
        body: `${joinerName} joined "${wsName}"`,
        resourceType: 'workspace',
        resourceId: invitation.workspace_id,
        actionUrl: '/workspace/members',
      });
    }
  }

  revalidatePath('/workspace/members');
  revalidatePath('/dashboard');
  return { success: true, workspaceId: invitation.workspace_id };
}

export async function rejectInvitation(invitationId: string) {
  const user = await requireUser();
  const admin = createAdminClient();

  // Get invitation with inviter info
  const { data: invitation } = await admin
    .from('workspace_invitations')
    .select('id, email, workspace_id, invited_by')
    .eq('id', invitationId)
    .single();

  if (!invitation) return { error: 'Invitation not found' };

  // Verify the invitation is for this user
  const { data: profile } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single();
  if (!profile || profile.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return { error: 'This invitation is not for you' };
  }

  // Reject: set revoked_at
  await admin
    .from('workspace_invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', invitationId);

  // Remove the invite notification
  await admin.from('notifications').delete().eq('action_url', `/invite/${invitationId}`);

  // Notify the inviter that invitation was declined
  if (invitation.invited_by) {
    const { data: wsInfo } = await admin
      .from('workspaces')
      .select('name')
      .eq('id', invitation.workspace_id)
      .single();
    const declinerName = profile.full_name ?? profile.email;
    const wsName = wsInfo?.name ?? 'the workspace';

    await admin.from('notifications').insert({
      recipient_id: invitation.invited_by,
      workspace_id: invitation.workspace_id,
      type: 'invitation_declined',
      title: `${declinerName} declined your invitation`,
      body: `${declinerName} declined the invitation to join "${wsName}".`,
      action_url: '/workspace/members',
    });
  }

  revalidatePath('/workspace/members');
  return { success: true };
}
