'use server';

import { requireUser } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';

export async function pollAIRunStatus(aiRunId: string) {
  await requireUser();
  const supabase = await createClient();

  const { data: run } = await supabase
    .from('ai_runs')
    .select('status, error_message')
    .eq('id', aiRunId)
    .single();

  if (!run) return { status: 'not_found' as const, error: null };

  return {
    status: run.status as 'queued' | 'running' | 'success' | 'error',
    error: run.error_message as string | null,
  };
}
