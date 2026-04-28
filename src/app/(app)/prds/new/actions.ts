'use server';

import { createClient } from '@/lib/supabase/server';
import { createEmptyPRD } from '@/lib/prd/schema';
import { redirect } from 'next/navigation';

export async function createPRDAndGenerate(data: {
  workspaceId: string;
  userId: string;
  title: string;
  projectTag?: string;
  brief: string;
  startDate?: string;
  endDate?: string;
}) {
  const supabase = await createClient();
  const emptyPRD = createEmptyPRD(data.userId, data.title);

  const { data: prd, error } = await supabase
    .from('prds')
    .insert({
      workspace_id: data.workspaceId,
      owner_id: data.userId,
      title: data.title,
      project_tag: data.projectTag || null,
      status: 'draft',
      content: emptyPRD,
      metadata: { start_date: data.startDate, end_date: data.endDate },
    })
    .select('id')
    .single();

  if (error || !prd) throw new Error('Failed to create PRD');

  await supabase.from('ai_runs').insert({
    workspace_id: data.workspaceId,
    prd_id: prd.id,
    user_id: data.userId,
    type: 'generate_prd',
    status: 'queued',
    model_used: 'pending',
    input_payload: {
      brief: data.brief,
      title: data.title,
      project_tag: data.projectTag,
    },
  });

  redirect(`/prds/${prd.id}?generating=true`);
}
