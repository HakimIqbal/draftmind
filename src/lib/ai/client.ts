import 'server-only';
import type { LanguageModelV1 } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { decryptApiKey } from '@/lib/utils/crypto';
import { PROVIDER_REGISTRY } from './providers';

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
  const supabase = await createClient();

  const { data: provider, error } = await supabase
    .from('providers')
    .select('id, type, display_name, default_model, base_url, api_key_encrypted, status')
    .eq('id', providerId)
    .single();

  if (error || !provider) {
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

export async function getDefaultAIClient(workspaceId: string): Promise<AIClientResult> {
  const supabase = await createClient();

  const { data: provider } = await supabase
    .from('providers')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('is_default', true)
    .single();

  if (!provider) {
    const { data: anyProvider } = await supabase
      .from('providers')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (!anyProvider) {
      throw new Error('No AI provider configured. Go to Settings → Providers to add one.');
    }

    return createAIClient(anyProvider.id);
  }

  return createAIClient(provider.id);
}
