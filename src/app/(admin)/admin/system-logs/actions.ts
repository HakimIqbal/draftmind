'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';

async function requireSuperAdmin() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();
  if (!data?.is_super_admin) throw new Error('Forbidden');
  return user;
}

export async function fetchSystemLogs(filters?: {
  level?: string;
  limit?: number;
  offset?: number;
}) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  let query = admin
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filters?.limit ?? 100);

  if (filters?.level && filters.level !== 'all') {
    query = query.eq('level', filters.level);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters?.limit ?? 100) - 1);
  }

  const { data, error } = await query;
  if (error) return { logs: [], error: error.message };
  return { logs: data ?? [] };
}

export async function resolveLog(logId: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();

  await admin.from('system_logs').update({ resolved_at: new Date().toISOString() }).eq('id', logId);

  return { success: true };
}

export async function resolveAllLogs() {
  await requireSuperAdmin();
  const admin = createAdminClient();
  await admin
    .from('system_logs')
    .update({ resolved_at: new Date().toISOString() })
    .is('resolved_at', null);
  return { success: true };
}

export async function getUnresolvedLogs() {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from('system_logs')
    .select('id, source, message, level, created_at, metadata')
    .eq('level', 'error')
    .is('resolved_at', null)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getLogStats() {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { count: errorCount } = await admin
    .from('system_logs')
    .select('*', { count: 'exact', head: true })
    .eq('level', 'error')
    .is('resolved_at', null);

  const { count: warnCount } = await admin
    .from('system_logs')
    .select('*', { count: 'exact', head: true })
    .eq('level', 'warn')
    .is('resolved_at', null);

  const { count: totalToday } = await admin
    .from('system_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 86400000).toISOString());

  return {
    unresolvedErrors: errorCount ?? 0,
    unresolvedWarnings: warnCount ?? 0,
    totalToday: totalToday ?? 0,
  };
}
