import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';

export async function GET(_request: Request, { params }: { params: Promise<{ prdId: string }> }) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { prdId } = await params;
  const supabase = await createClient();

  // Verify PRD belongs to user's workspace
  const { data: prd } = await supabase
    .from('prds')
    .select('id')
    .eq('id', prdId)
    .eq('workspace_id', workspace.id)
    .single();

  if (!prd) return NextResponse.json({ error: 'PRD not found' }, { status: 404 });

  const { data } = await supabase
    .from('prd_versions')
    .select('id, version_number, content, change_summary, source, created_by, created_at')
    .eq('prd_id', prdId)
    .order('version_number', { ascending: false });

  // Resolve author names
  const authorIds = [...new Set((data ?? []).map((v) => v.created_by).filter(Boolean))];
  let authorMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', authorIds);
    authorMap = Object.fromEntries((authors ?? []).map((a) => [a.id, a.full_name ?? 'Unknown']));
  }

  const versions = (data ?? []).map((v) => ({
    ...v,
    author_name: v.created_by ? (authorMap[v.created_by] ?? 'Unknown') : 'System',
  }));

  return NextResponse.json({ versions });
}

export async function POST(request: Request, { params }: { params: Promise<{ prdId: string }> }) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { prdId } = await params;
  const body = await request.json();
  const supabase = await createClient();

  // Verify PRD belongs to user's workspace
  const { data: prd } = await supabase
    .from('prds')
    .select('content, tiptap_content, current_version')
    .eq('id', prdId)
    .eq('workspace_id', workspace.id)
    .single();

  if (!prd) return NextResponse.json({ error: 'PRD not found' }, { status: 404 });

  const newContent = prd.tiptap_content ?? prd.content;

  // Skip if content is identical to latest version (no actual changes)
  const { data: latestVersion } = await supabase
    .from('prd_versions')
    .select('content')
    .eq('prd_id', prdId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  if (latestVersion && JSON.stringify(latestVersion.content) === JSON.stringify(newContent)) {
    return NextResponse.json({ version: prd.current_version, skipped: true });
  }

  const nextVersion = prd.current_version + 1;
  await supabase.from('prd_versions').insert({
    prd_id: prdId,
    version_number: nextVersion,
    content: newContent,
    change_summary: body.summary ?? 'Manual snapshot',
    source: body.source ?? 'manual',
    created_by: user.id,
  });
  await supabase.from('prds').update({ current_version: nextVersion }).eq('id', prdId);

  return NextResponse.json({ version: nextVersion });
}
