'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { logError } from '@/lib/logging/system-log';

interface UpdateProfileData {
  full_name: string;
  role_self_reported?: string;
  experience_level?: string;
  default_locale?: string;
}

async function logProfileActivity(
  userId: string,
  metadata: Record<string, unknown>,
  activityType: string = 'profile_updated',
) {
  try {
    const admin = createAdminClient();
    const { data: membership } = await admin
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (membership) {
      await admin.from('activity_log').insert({
        workspace_id: membership.workspace_id,
        actor_id: userId,
        type: activityType,
        resource_type: 'user',
        resource_id: userId,
        metadata,
      });
    }
  } catch {
    // Never block profile update if logging fails
  }
}

export async function getProfile() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, role_self_reported, created_at, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase.from('workspace_members').select('role').eq('user_id', user.id).limit(1).single(),
  ]);

  return {
    profile: profile ?? null,
    email: user.email ?? '',
    workspaceRole: membership?.role ?? null,
  };
}

export async function updateProfile(data: UpdateProfileData) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: oldProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const updates: Record<string, string> = { full_name: data.full_name };
  if (data.role_self_reported !== undefined) updates.role_self_reported = data.role_self_reported;
  if (data.experience_level !== undefined) updates.experience_level = data.experience_level;
  if (data.default_locale !== undefined) updates.default_locale = data.default_locale;

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);

  if (error) {
    logError('profile.update', error.message, {}, user.id);
    return { error: 'Failed to update profile' };
  }

  if (oldProfile && oldProfile.full_name !== data.full_name) {
    await logProfileActivity(user.id, {
      action: 'profile_updated',
      changed_by: 'self',
      fields_changed: ['full_name'],
      changes: { full_name: { old: oldProfile.full_name, new: data.full_name } },
    });
  }

  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const file = formData.get('avatar') as File;
  if (!file) return { error: 'No file provided' };
  if (file.size > 2 * 1024 * 1024) return { error: 'File too large. Max 2MB.' };
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { error: 'Only JPG, PNG, or WebP allowed' };
  }

  const ext = file.type.split('/')[1] ?? 'png';
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    logError('profile.avatar', uploadError.message, {}, user.id);
    return { error: 'Failed to upload avatar' };
  }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id);

  if (updateError) {
    logError('profile.avatar', updateError.message, {}, user.id);
    return { error: 'Failed to save avatar' };
  }

  await logProfileActivity(user.id, {
    action: 'profile_updated',
    changed_by: 'self',
    fields_changed: ['avatar'],
    changes: { avatar: { old: null, new: 'uploaded' } },
  });

  revalidatePath('/', 'layout');

  return { success: true, avatarUrl };
}

export async function forceChangePassword(newPassword: string) {
  const user = await requireUser();

  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    logError('profile.forceChangePassword', error.message, {}, user.id);
    return { error: 'Failed to update password. Please try again.' };
  }

  const admin = createAdminClient();
  await admin.from('profiles').update({ force_password_change: false }).eq('id', user.id);

  redirect('/dashboard');
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const user = await requireUser();
  const supabase = await createClient();

  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters' };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: oldPassword,
  });

  if (signInError) {
    return { error: 'Current password is incorrect' };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    logError('profile.changePassword', updateError.message, {}, user.id);
    return { error: 'Failed to change password' };
  }

  const admin = createAdminClient();
  await admin.from('profiles').update({ force_password_change: false }).eq('id', user.id);

  await logProfileActivity(
    user.id,
    {
      changed_by: 'self',
    },
    'password_changed',
  );

  return { success: true };
}
