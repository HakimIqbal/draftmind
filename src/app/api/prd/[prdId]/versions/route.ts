import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: Request, { params }: { params: Promise<{ prdId: string }> }) {
  const { prdId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('prd_versions')
    .select('id, version_number, change_summary, source, created_by, created_at')
    .eq('prd_id', prdId)
    .order('version_number', { ascending: false });
  return NextResponse.json({ versions: data ?? [] });
}

export async function POST(request: Request, { params }: { params: Promise<{ prdId: string }> }) {
  const { prdId } = await params;
  const body = await request.json();
  const supabase = await createClient();

  const { data: prd } = await supabase
    .from('prds')
    .select('content, current_version')
    .eq('id', prdId)
    .single();
  if (!prd) return NextResponse.json({ error: 'PRD not found' }, { status: 404 });

  const nextVersion = prd.current_version + 1;
  await supabase.from('prd_versions').insert({
    prd_id: prdId,
    version_number: nextVersion,
    content: prd.content,
    change_summary: body.summary ?? 'Manual snapshot',
    source: body.source ?? 'manual',
    created_by: body.userId,
  });
  await supabase.from('prds').update({ current_version: nextVersion }).eq('id', prdId);

  return NextResponse.json({ version: nextVersion });
}
