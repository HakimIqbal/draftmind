import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GenerationLoading } from '@/components/generate/generation-loading';
import { EditorShell } from '@/components/editor/editor-shell';

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ prdId: string }>;
  searchParams: Promise<{ generating?: string }>;
}) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect('/dashboard');

  const { prdId } = await params;
  const { generating } = await searchParams;
  const supabase = await createClient();

  const { data: prd } = await supabase.from('prds').select('*').eq('id', prdId).single();

  if (!prd) redirect('/prds');

  if (generating === 'true') {
    const { data: aiRun } = await supabase
      .from('ai_runs')
      .select('id, status')
      .eq('prd_id', prdId)
      .eq('type', 'generate_prd')
      .in('status', ['queued', 'running'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (aiRun) {
      return (
        <GenerationLoading prdId={prdId} aiRunId={aiRun.id} workspaceId={workspace.id as string} />
      );
    }
  }

  const userName =
    (user.user_metadata as Record<string, string> | undefined)?.full_name ?? user.email ?? 'User';

  return (
    <EditorShell
      prd={{
        id: prd.id,
        title: prd.title,
        project_tag: prd.project_tag,
        status: prd.status,
        current_version: prd.current_version,
        health_score: prd.health_score,
        health_breakdown: prd.health_breakdown as Record<string, number> | null,
        word_count: prd.word_count,
        read_time_minutes: prd.read_time_minutes,
        content: prd.content as Record<string, unknown>,
        tiptap_content: prd.tiptap_content as Record<string, unknown> | null,
        updated_at: prd.updated_at,
      }}
      userName={userName}
    />
  );
}
