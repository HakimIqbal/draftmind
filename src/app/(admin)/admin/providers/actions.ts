'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/permissions';
import { encryptApiKey } from '@/lib/utils/crypto';
import { PROVIDER_REGISTRY } from '@/lib/ai/providers';
import { revalidatePath } from 'next/cache';
import { logInfo } from '@/lib/logging/system-log';
import { logActivity } from '@/lib/logging/activity-log';

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

async function getProviderAuditWorkspaceId(admin: ReturnType<typeof createAdminClient>) {
  const { data: workspace } = await admin
    .from('workspaces')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return workspace?.id ?? null;
}

async function logProviderAdminActivity(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    actorId: string;
    type: 'provider_added' | 'provider_disconnected';
    providerId?: string;
    metadata?: Record<string, unknown>;
  },
) {
  try {
    const workspaceId = await getProviderAuditWorkspaceId(admin);
    if (!workspaceId) return;

    await logActivity({
      workspaceId,
      actorId: input.actorId,
      type: input.type,
      resourceType: 'provider',
      resourceId: input.providerId,
      metadata: input.metadata,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown provider activity log error';
    logInfo(
      'activity-log',
      `provider activity insert failed: ${message}`,
      {
        type: input.type,
        provider_id: input.providerId,
      },
      input.actorId,
    );
  }
}

export async function getProviders() {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data } = await admin
    .from('providers')
    .select(
      'id, type, display_name, status, is_default, default_model, base_url, priority, use_for, total_requests, successful_requests, failed_requests, avg_latency_ms, last_used_at, last_error, created_at',
    )
    .order('priority', { ascending: true });

  return (data ?? []) as {
    id: string;
    type: string;
    display_name: string;
    status: string;
    is_default: boolean;
    default_model: string;
    base_url: string | null;
    priority: number;
    use_for: string;
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    avg_latency_ms: number;
    last_used_at: string | null;
    last_error: string | null;
    created_at: string;
  }[];
}

export async function getProviderRegistry() {
  await requireSuperAdmin();
  return Object.entries(PROVIDER_REGISTRY).map(([key, config]) => ({
    key,
    displayName: config.displayName,
    defaultModel: config.defaultModel,
    availableModels: config.availableModels,
    requiresBaseUrl: config.requiresBaseUrl,
    defaultBaseUrl: config.baseUrl,
  }));
}

export async function validateBaseUrl(
  baseUrl: string,
): Promise<{ valid: boolean; message: string }> {
  await requireSuperAdmin();

  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    return { valid: false, message: 'URL must start with http:// or https://' };
  }

  try {
    const url = new URL(baseUrl);
    if (!url.hostname) return { valid: false, message: 'Invalid hostname' };
    return { valid: true, message: 'URL format is valid' };
  } catch {
    return { valid: false, message: 'Invalid URL format' };
  }
}

export async function testProviderConnection(data: {
  type: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
}): Promise<{ success: boolean; message: string; latency?: number }> {
  await requireSuperAdmin();

  if (!data.apiKey || data.apiKey.length < 5) {
    return { success: false, message: 'API key is too short' };
  }

  const config = PROVIDER_REGISTRY[data.type];
  if (!config) {
    return { success: false, message: 'Unknown provider type' };
  }

  try {
    const start = Date.now();
    const model = config.createModel(data.apiKey, data.model, data.baseUrl);

    // Import generateText dynamically
    const { generateText } = await import('ai');
    await generateText({
      model,
      prompt: 'Say "ok"',
      maxTokens: 5,
    });

    const latency = Date.now() - start;
    return { success: true, message: `Connected to ${config.displayName}`, latency };
  } catch (err) {
    // Error details logged to system_logs, not exposed to UI
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('invalid')) {
      return { success: false, message: 'Invalid API key. Please check and try again.' };
    }
    if (msg.includes('404') || msg.includes('not found')) {
      return { success: false, message: 'Provider endpoint not found. Check base URL.' };
    }
    return { success: false, message: 'Failed to connect. Verify API key and settings.' };
  }
}

export async function addProvider(data: {
  type: string;
  displayName: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  priority: number;
  useFor: string;
}) {
  const user = await requireSuperAdmin();
  const admin = createAdminClient();

  const encryptedKey = encryptApiKey(data.apiKey);

  // Get first workspace as fallback (for DB constraint)
  const { data: ws } = await admin.from('workspaces').select('id').limit(1).single();

  const { error } = await admin.from('providers').insert({
    workspace_id: ws?.id ?? null,
    type: data.type,
    display_name: data.displayName,
    api_key_encrypted: encryptedKey,
    base_url: data.baseUrl ?? null,
    default_model: data.model,
    available_models: PROVIDER_REGISTRY[data.type]?.availableModels ?? [data.model],
    is_default: data.priority === 1,
    status: 'active',
    priority: data.priority,
    use_for: data.useFor,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  const { data: createdProvider } = await admin
    .from('providers')
    .select('id')
    .eq('created_by', user.id)
    .eq('display_name', data.displayName)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  await logProviderAdminActivity(admin, {
    actorId: user.id,
    type: 'provider_added',
    providerId: createdProvider?.id,
    metadata: {
      display_name: data.displayName,
      provider_type: data.type,
      default_model: data.model,
      use_for: data.useFor,
      priority: data.priority,
    },
  });

  logInfo(
    'admin.provider',
    `provider_added: ${data.displayName} (${data.type})`,
    { display_name: data.displayName, type: data.type },
    user.id,
  );

  revalidatePath('/admin/providers');
  return { success: true };
}

export async function disconnectProvider(providerId: string) {
  const user = await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: providerBefore } = await admin
    .from('providers')
    .select('display_name, type, status')
    .eq('id', providerId)
    .maybeSingle();

  const { error } = await admin
    .from('providers')
    .update({ status: 'disconnected' })
    .eq('id', providerId);
  if (error) return { error: error.message };

  await logProviderAdminActivity(admin, {
    actorId: user.id,
    type: 'provider_disconnected',
    providerId,
    metadata: {
      display_name: providerBefore?.display_name,
      provider_type: providerBefore?.type,
      previous_status: providerBefore?.status,
      next_status: 'disconnected',
    },
  });

  logInfo('admin.provider', `provider_disconnected: ${providerId}`, { providerId }, user.id);

  revalidatePath('/admin/providers');
  return { success: true };
}

export async function activateProvider(providerId: string) {
  const user = await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from('providers').update({ status: 'active' }).eq('id', providerId);
  if (error) return { error: error.message };

  logInfo('admin.provider', `provider_activated: ${providerId}`, { providerId }, user.id);

  revalidatePath('/admin/providers');
  return { success: true };
}

export async function deleteProvider(providerId: string) {
  const user = await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from('providers').delete().eq('id', providerId);
  if (error) return { error: error.message };

  logInfo('admin.provider', `provider_deleted: ${providerId}`, { providerId }, user.id);

  revalidatePath('/admin/providers');
  return { success: true };
}

export async function updateProviderPriority(providerId: string, priority: number) {
  const user = await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from('providers')
    .update({ priority, is_default: priority === 1 })
    .eq('id', providerId);
  if (error) return { error: error.message };

  logInfo(
    'admin.provider',
    `provider_priority_changed: ${providerId} → ${priority}`,
    { providerId, priority },
    user.id,
  );

  revalidatePath('/admin/providers');
  return { success: true };
}

export async function updateProviderUseFor(providerId: string, useFor: string) {
  const user = await requireSuperAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from('providers').update({ use_for: useFor }).eq('id', providerId);
  if (error) return { error: error.message };

  logInfo(
    'admin.provider',
    `provider_use_for_changed: ${providerId} → ${useFor}`,
    { providerId, use_for: useFor },
    user.id,
  );

  revalidatePath('/admin/providers');
  return { success: true };
}
