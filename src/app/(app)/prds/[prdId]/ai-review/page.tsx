import { requireUser } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AIReviewPage } from '@/components/refine/ai-review-page';

export default async function AIReviewRoute({ params }: { params: Promise<{ prdId: string }> }) {
  await requireUser();
  const { prdId } = await params;
  const supabase = await createClient();

  const { data: prd } = await supabase.from('prds').select('*').eq('id', prdId).single();
  if (!prd) redirect('/prds');

  // Get most recent AI review run
  const { data: aiRun } = await supabase
    .from('ai_runs')
    .select('id, status, completed_at')
    .eq('prd_id', prdId)
    .eq('type', 'ai_review')
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get findings if review exists
  let findings: Array<Record<string, unknown>> = [];
  if (aiRun) {
    const { data } = await supabase
      .from('ai_review_findings')
      .select('*')
      .eq('ai_run_id', aiRun.id)
      .order('severity', { ascending: true });
    findings = data ?? [];
  }

  return (
    <AIReviewPage
      prd={prd}
      findings={findings}
      hasReview={!!aiRun}
      reviewDate={aiRun?.completed_at}
    />
  );
}
