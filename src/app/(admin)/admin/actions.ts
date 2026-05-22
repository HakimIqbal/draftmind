'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/permissions';
import { revalidatePath } from 'next/cache';
import { logInfo } from '@/lib/logging/system-log';

async function requireSuperAdmin() {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_super_admin) throw new Error('Not authorized');
  return user;
}

export async function toggleSuperAdmin(targetUserId: string) {
  const user = await requireSuperAdmin();
  if (targetUserId === user.id) return { error: 'Cannot change your own admin status' };

  const admin = createAdminClient();
  const { data: target } = await admin
    .from('profiles')
    .select('is_super_admin')
    .eq('id', targetUserId)
    .single();

  if (!target) return { error: 'User not found' };

  const { error } = await admin
    .from('profiles')
    .update({ is_super_admin: !target.is_super_admin })
    .eq('id', targetUserId);

  if (error) return { error: 'Failed to update admin status. Please try again.' };

  logInfo(
    'admin.action',
    `super_admin_toggled: ${targetUserId} → ${!target.is_super_admin}`,
    { targetUserId },
    user.id,
  );

  revalidatePath('/admin');
  return { success: true };
}

export async function toggleUserStatus(targetUserId: string) {
  const user = await requireSuperAdmin();
  if (targetUserId === user.id) return { error: 'Cannot disable your own account' };

  const admin = createAdminClient();

  // Get current ban status from auth.users
  const {
    data: { user: targetUser },
  } = await admin.auth.admin.getUserById(targetUserId);

  if (!targetUser) return { error: 'User not found' };

  const isBanned = targetUser.banned_until && new Date(targetUser.banned_until) > new Date();

  if (isBanned) {
    // Unban
    const { error } = await admin.auth.admin.updateUserById(targetUserId, {
      ban_duration: 'none',
    });
    if (error) return { error: error.message };
  } else {
    // Ban (set far future)
    const { error } = await admin.auth.admin.updateUserById(targetUserId, {
      ban_duration: '876000h', // ~100 years
    });
    if (error) return { error: error.message };
  }

  logInfo(
    'admin.action',
    `${isBanned ? 'user_unbanned' : 'user_banned'}: ${targetUserId}`,
    { targetUserId },
    user.id,
  );

  revalidatePath('/admin');
  return { success: true, disabled: !isBanned };
}

export async function createUser(data: {
  email: string;
  password: string;
  full_name: string;
  role_self_reported: string;
  is_super_admin: boolean;
}) {
  await requireSuperAdmin();

  if (!data.full_name?.trim()) return { error: 'Full name is required' };
  if (!data.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    return { error: 'Valid email is required' };
  if (!data.password || data.password.length < 8)
    return { error: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(data.password) || !/[0-9]/.test(data.password))
    return { error: 'Password must contain uppercase and number' };

  const admin = createAdminClient();

  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.full_name },
  });

  if (authError) return { error: authError.message };

  if (newUser.user) {
    console.log('[createUser] role_self_reported received:', data.role_self_reported);
    console.log('[createUser] is_super_admin:', data.is_super_admin);
    console.log(
      '[createUser] final role to upsert:',
      data.is_super_admin ? 'System Administrator' : data.role_self_reported,
    );

    // Use upsert instead of update — the handle_new_user trigger may not have
    // committed the profiles row yet when this runs (race condition).
    const nameParts = data.full_name.trim().split(' ');
    const initials = (
      (nameParts[0]?.charAt(0) ?? '') + (nameParts[1]?.charAt(0) ?? '')
    ).toUpperCase();

    const { error: profileError } = await admin.from('profiles').upsert(
      {
        id: newUser.user.id,
        email: data.email,
        full_name: data.full_name,
        avatar_initials: initials,
        avatar_color_seed: newUser.user.id,
        role_self_reported: data.is_super_admin ? 'System Administrator' : data.role_self_reported,
        is_super_admin: data.is_super_admin,
        onboarding_completed_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

    if (profileError) {
      logInfo(
        'admin.action',
        `profile_upsert_failed: ${profileError.message}`,
        {},
        newUser.user.id,
      );
    }
  }

  if (newUser.user) {
    logInfo(
      'admin.action',
      `user_created_by_admin: ${data.email}`,
      { email: data.email, full_name: data.full_name },
      newUser.user.id,
    );
  }

  revalidatePath('/admin/users');
  return { success: true };
}

const DEFAULT_PASSWORD = 'DraftMind2026!';

export async function resetUserPassword(targetUserId: string) {
  const user = await requireSuperAdmin();
  if (targetUserId === user.id) return { error: 'Cannot reset your own password' };

  const admin = createAdminClient();

  // Reset password to default
  const { error } = await admin.auth.admin.updateUserById(targetUserId, {
    password: DEFAULT_PASSWORD,
  });

  if (error) return { error: error.message };

  // Set force_password_change flag
  await admin.from('profiles').update({ force_password_change: true }).eq('id', targetUserId);

  // Get target user info for logging
  const { data: target } = await admin
    .from('profiles')
    .select('full_name, email')
    .eq('id', targetUserId)
    .single();

  const { data: adminProfile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // Log to activity_log
  const { data: membership } = await admin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', targetUserId)
    .limit(1)
    .single();

  if (membership) {
    await admin.from('activity_log').insert({
      workspace_id: membership.workspace_id,
      actor_id: user.id,
      type: 'password_reset',
      resource_type: 'user',
      resource_id: targetUserId,
      metadata: {
        admin_name: adminProfile?.full_name ?? 'Admin',
        target_user: target?.email ?? targetUserId,
        target_name: target?.full_name ?? 'Unknown',
        reset_to: 'default',
      },
    });
  }

  revalidatePath('/admin/users');
  return { success: true };
}
