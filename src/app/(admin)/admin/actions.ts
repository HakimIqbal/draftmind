'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
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

  if (error) return { error: error.message };
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
  const admin = createAdminClient();

  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name: data.full_name },
  });

  if (authError) return { error: authError.message };

  if (newUser.user) {
    await admin
      .from('profiles')
      .update({
        full_name: data.full_name,
        role_self_reported: data.role_self_reported,
        is_super_admin: data.is_super_admin,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', newUser.user.id);
  }

  revalidatePath('/admin/users');
  return { success: true };
}
