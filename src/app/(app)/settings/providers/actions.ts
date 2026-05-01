'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';
import { encryptApiKey } from '@/lib/utils/crypto';
import { revalidatePath } from 'next/cache';

// ── Add Provider ──

interface AddProviderInput {
  workspaceId: string;
  providerType: string;
  displayName: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  isDefault: boolean;
}

export async function addProvider(input: AddProviderInput) {
  const user = await requireUser();
  const supabase = await createClient();

  const encryptedKey = encryptApiKey(input.apiKey);

  // If setting as default, unset existing defaults first
  if (input.isDefault) {
    await supabase
      .from('providers')
      .update({ is_default: false })
      .eq('workspace_id', input.workspaceId);
  }

  const { error } = await supabase.from('providers').insert({
    workspace_id: input.workspaceId,
    type: input.providerType,
    display_name: input.displayName,
    api_key_encrypted: encryptedKey,
    base_url: input.baseUrl ?? null,
    default_model: input.model,
    available_models: [input.model],
    is_default: input.isDefault,
    status: 'active',
    created_by: user.id,
  });

  if (error) {
    throw new Error(`Failed to add provider: ${error.message}`);
  }

  revalidatePath('/settings/providers');
}

// ── Test Provider ──

export async function testProvider(
  type: string,
  apiKey: string,
  _baseUrl?: string,
): Promise<{ success: boolean; message: string }> {
  await requireUser();

  // Mock test — in production this would make a real API call
  // to verify the key is valid
  if (!apiKey || apiKey.length < 5) {
    return { success: false, message: 'API key is too short' };
  }

  // Simulate a brief delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return { success: true, message: `Successfully connected to ${type}` };
}

// ── Disconnect Provider ──

export async function disconnectProvider(providerId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from('providers')
    .update({ status: 'disconnected' })
    .eq('id', providerId);

  if (error) {
    throw new Error(`Failed to disconnect provider: ${error.message}`);
  }

  revalidatePath('/settings/providers');
}

// ── Set Default Provider ──

export async function setDefaultProvider(providerId: string, workspaceId: string) {
  await requireUser();
  const supabase = await createClient();

  // Unset all defaults
  await supabase.from('providers').update({ is_default: false }).eq('workspace_id', workspaceId);

  // Set the new default
  const { error } = await supabase
    .from('providers')
    .update({ is_default: true })
    .eq('id', providerId);

  if (error) {
    throw new Error(`Failed to set default provider: ${error.message}`);
  }

  revalidatePath('/settings/providers');
}
