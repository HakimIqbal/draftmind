'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

interface TestProviderInput {
  type: string;
  apiKey: string;
}

export async function testProvider(input: TestProviderInput) {
  // Mock test for Phase 2 — real AI validation in Phase 3
  if (!input.apiKey || input.apiKey.length < 8) {
    return { ok: false, error: 'Invalid API key format' };
  }

  const model =
    input.type === 'anthropic'
      ? 'claude-sonnet-4-6'
      : input.type === 'openai'
        ? 'gpt-4o'
        : input.type === 'gemini'
          ? 'gemini-2.0-flash'
          : input.type === 'groq'
            ? 'llama-3.3-70b'
            : input.type === 'sumopod'
              ? 'sumopod-v1'
              : 'ganrouter-v1';

  return {
    ok: true,
    model,
    message: 'Connection successful',
    latency_ms: 234,
  };
}

interface FinalizeOnboardingInput {
  workspace_id: string;
  provider_type: string | null;
  provider_api_key: string | null;
  invite_emails: string[];
}

export async function finalizeOnboarding(input: FinalizeOnboardingInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Not authenticated' };
  }

  // Save provider if provided
  if (input.provider_type && input.provider_api_key) {
    const { error: providerError } = await supabase.from('providers').insert({
      workspace_id: input.workspace_id,
      type: input.provider_type,
      api_key_encrypted: input.provider_api_key, // TODO: encrypt in Phase 3
      created_by: user.id,
    });

    if (providerError) {
      return { error: providerError.message };
    }
  }

  // Create workspace invitations
  if (input.invite_emails.length > 0) {
    const invitations = input.invite_emails.map((email) => ({
      workspace_id: input.workspace_id,
      email,
      invited_by: user.id,
      status: 'pending',
    }));

    const { error: inviteError } = await supabase.from('workspace_invitations').insert(invitations);

    if (inviteError) {
      return { error: inviteError.message };
    }
  }

  // Update profile onboarding status
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  // Set current workspace cookie
  const cookieStore = await cookies();
  cookieStore.set('current_workspace_id', input.workspace_id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return { success: true };
}
