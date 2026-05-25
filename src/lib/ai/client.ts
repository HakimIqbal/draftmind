import 'server-only';
import type { LanguageModelV1 } from 'ai';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptApiKey } from '@/lib/utils/crypto';
import { PROVIDER_REGISTRY } from './providers';
import { logError, logWarn, logInfo } from '@/lib/logging/system-log';

export interface AIClientResult {
  provider: {
    id: string;
    type: string;
    display_name: string;
    default_model: string;
    base_url: string | null;
  };
  model: LanguageModelV1;
  modelId: string;
}

export async function createAIClient(providerId: string): Promise<AIClientResult> {
  const supabase = createAdminClient();

  const { data: provider, error } = await supabase
    .from('providers')
    .select('id, type, display_name, default_model, base_url, api_key_encrypted, status')
    .eq('id', providerId)
    .single();

  if (error || !provider) {
    logError('supabase_admin_api_failure', error?.message ?? 'Provider not found', { providerId });
    throw new Error('Provider not found');
  }

  if (provider.status !== 'active') {
    throw new Error(`Provider ${provider.display_name} is ${provider.status}`);
  }

  const config = PROVIDER_REGISTRY[provider.type];
  if (!config) {
    throw new Error(`Unknown provider type: ${provider.type}`);
  }

  const apiKey = decryptApiKey(provider.api_key_encrypted);
  const model = config.createModel(apiKey, provider.default_model, provider.base_url ?? undefined);

  return {
    provider: {
      id: provider.id,
      type: provider.type,
      display_name: provider.display_name,
      default_model: provider.default_model,
      base_url: provider.base_url,
    },
    model,
    modelId: provider.default_model,
  };
}

/**
 * Smart Router: Get AI client by priority with automatic fallback.
 * Tries providers in priority order (1 = highest).
 * If a provider fails, automatically tries the next one.
 */
export async function getDefaultAIClient(_workspaceId?: string): Promise<AIClientResult> {
  const admin = createAdminClient();

  // Get all active providers ordered by priority (global — not workspace-scoped)
  const { data: providers } = await admin
    .from('providers')
    .select(
      'id, type, display_name, default_model, base_url, api_key_encrypted, status, priority, use_for',
    )
    .eq('status', 'active')
    .order('priority', { ascending: true });

  if (!providers || providers.length === 0) {
    throw new Error(
      'No AI provider configured. Admin must add a provider in Admin → AI Providers.',
    );
  }

  // Try providers in priority order
  const errors: string[] = [];

  for (const provider of providers) {
    const config = PROVIDER_REGISTRY[provider.type];
    if (!config) continue;

    try {
      const apiKey = decryptApiKey(provider.api_key_encrypted);
      const model = config.createModel(
        apiKey,
        provider.default_model,
        provider.base_url ?? undefined,
      );

      return {
        provider: {
          id: provider.id,
          type: provider.type,
          display_name: provider.display_name,
          default_model: provider.default_model,
          base_url: provider.base_url,
        },
        model,
        modelId: provider.default_model,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${provider.display_name}: ${msg}`);
      continue;
    }
  }

  throw new Error(`All providers failed: ${errors.join('; ')}`);
}

/**
 * Update provider stats after a request (success or failure).
 * Called from API routes after AI generation completes.
 */
export async function updateProviderStats(
  providerId: string,
  success: boolean,
  latencyMs: number,
  errorMsg?: string,
) {
  const admin = createAdminClient();

  // Get current stats
  const { data: provider } = await admin
    .from('providers')
    .select('total_requests, successful_requests, failed_requests, avg_latency_ms')
    .eq('id', providerId)
    .single();

  if (!provider) {
    logError('supabase_admin_api_failure', 'Provider stats row not found', { providerId });
    return;
  }

  const totalRequests = (provider.total_requests ?? 0) + 1;
  const successfulRequests = (provider.successful_requests ?? 0) + (success ? 1 : 0);
  const failedRequests = (provider.failed_requests ?? 0) + (success ? 0 : 1);

  // Rolling average latency
  const prevAvg = provider.avg_latency_ms ?? 0;
  const avgLatency = Math.round((prevAvg * (totalRequests - 1) + latencyMs) / totalRequests);

  const previousFailures = provider.failed_requests ?? 0;
  const nextFailures = failedRequests;
  const wasDegraded = previousFailures >= 3;

  await admin
    .from('providers')
    .update({
      total_requests: totalRequests,
      successful_requests: successfulRequests,
      failed_requests: failedRequests,
      avg_latency_ms: avgLatency,
      last_used_at: new Date().toISOString(),
      ...(errorMsg ? { last_error: errorMsg } : {}),
    })
    .eq('id', providerId);

  if (!wasDegraded && !success && nextFailures >= 3) {
    logWarn('provider.health_degraded', 'Provider health degraded after repeated failures', {
      providerId,
      failedRequests: nextFailures,
    });
  }

  if (wasDegraded && success) {
    logInfo('provider.health_recovered', 'Provider recovered after previous failures', {
      providerId,
      failedRequests: nextFailures,
    });
  }
}
