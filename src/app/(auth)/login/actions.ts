'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logInfo } from '@/lib/logging/system-log';

export async function checkUserRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { redirect: '/login' };

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_super_admin, force_password_change')
    .eq('id', user.id)
    .single();

  if (error || !profile) return { redirect: '/dashboard', error: 'Failed to load profile' };

  // Force password change if admin reset the password
  if (profile.force_password_change) {
    return { redirect: '/dashboard?force_password_change=true' };
  }

  // Log login — fire and forget, NEVER block redirect
  const admin = createAdminClient();
  admin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()
    .then(
      ({ data: membership }) => {
        if (membership) {
          admin
            .from('activity_log')
            .insert({
              workspace_id: membership.workspace_id,
              actor_id: user.id,
              type: 'login',
              resource_type: 'user',
              resource_id: user.id,
              metadata: { timestamp: new Date().toISOString() },
            })
            .then(
              () => {},
              () => {},
            );
        }
      },
      () => {},
    );

  logInfo('auth.login', `User logged in: ${user.email ?? user.id}`, {}, user.id);

  return { redirect: profile.is_super_admin ? '/admin' : '/dashboard' };
}

export async function logLoginFailure(
  email: string,
  reason: 'invalid_credentials' | 'disabled_account',
) {
  const admin = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  const { data: workspace } = profile?.id
    ? await admin
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', profile.id)
        .limit(1)
        .maybeSingle()
    : { data: null };

  if (workspace?.workspace_id) {
    admin
      .from('activity_log')
      .insert({
        workspace_id: workspace.workspace_id,
        actor_id: profile?.id ?? null,
        type: 'login_failed',
        resource_type: 'user',
        resource_id: profile?.id ?? null,
        metadata: {
          email: normalizedEmail,
          reason,
          timestamp: new Date().toISOString(),
        },
      })
      .then(
        () => {},
        () => {},
      );
  }

  logInfo(
    'auth.login_failed',
    `Login failed for ${normalizedEmail}: ${reason}`,
    { email: normalizedEmail, reason },
    profile?.id ?? null,
  );
}

export async function checkBannedStatus(email: string): Promise<{ disabled: boolean }> {
  const admin = createAdminClient();

  // Find user by email
  const { data: profiles } = await admin.from('profiles').select('id').eq('email', email).limit(1);

  if (!profiles || profiles.length === 0) return { disabled: false };

  const userId = profiles[0]!.id;

  // Check ban status via auth admin API
  const {
    data: { user },
  } = await admin.auth.admin.getUserById(userId);
  if (!user) return { disabled: false };

  const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
  return { disabled: !!isBanned };
}
