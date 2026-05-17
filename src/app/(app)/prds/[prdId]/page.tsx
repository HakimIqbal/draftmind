import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { logWarn } from '@/lib/logging/system-log';
import { GenerationLoading } from '@/components/generate/generation-loading';
import { EditorShell } from '@/components/editor/editor-shell';

export const dynamic = 'force-dynamic';

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

  // Validate UUID format to prevent DB errors
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(prdId)) {
    notFound();
  }

  const supabase = await createClient();

  const { data: prd } = await supabase
    .from('prds')
    .select('*')
    .eq('id', prdId)
    .eq('workspace_id', workspace.id)
    .single();

  if (!prd) {
    logWarn('page.prd', `PRD not found: ${prdId}`, { prdId }, user.id);
    notFound();
  }

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

  // Fetch current user's profile for presence display
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single();
  const userAvatar =
    userProfile?.avatar_url ??
    (user.user_metadata as Record<string, string> | undefined)?.avatar_url ??
    null;

  // Fetch last editor profile (may differ from current user on collaborative PRDs)
  const lastEditorId =
    ((prd as Record<string, unknown>).last_edited_by as string | null) ?? prd.owner_id;
  const { data: lastEditorProfile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', lastEditorId)
    .single();

  // Fetch active AI providers for copilot model selector (admin client bypasses RLS)
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupa = createAdminClient();
  const { data: providersList } = await adminSupa
    .from('providers')
    .select('id, display_name, default_model')
    .eq('status', 'active')
    .order('priority', { ascending: true });

  // Permission: only workspace admin or PRD owner can change status
  const isAdmin = workspace.currentRole === 'admin';
  const isOwner = prd.owner_id === user.id;
  const canChangeStatus = isAdmin || isOwner;

  return (
    <EditorShell
      canChangeStatus={canChangeStatus}
      aiProviders={(providersList ?? []).map((p) => ({
        id: p.id,
        display_name: p.display_name,
        default_model: p.default_model,
      }))}
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
        hidden_sections: (prd as Record<string, unknown>).hidden_sections as string[] | null,
      }}
      userName={userName}
      userEmail={user.email ?? undefined}
      userAvatar={userAvatar}
      userId={user.id}
      workspaceId={workspace.id as string}
      lastEditorName={lastEditorProfile?.full_name ?? lastEditorProfile?.email ?? 'Unknown'}
      lastEditorEmail={lastEditorProfile?.email ?? undefined}
      lastEditorAvatar={lastEditorProfile?.avatar_url ?? null}
    />
  );
}
