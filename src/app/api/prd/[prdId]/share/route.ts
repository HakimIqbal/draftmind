import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { nanoid } from 'nanoid';
import { logActivity } from '@/lib/logging/activity-log';

export async function POST(request: Request, { params }: { params: Promise<{ prdId: string }> }) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { prdId } = await params;
  const body = await request.json();
  const supabase = await createClient();

  // Verify PRD belongs to user's workspace
  const { data: prd } = await supabase
    .from('prds')
    .select('id')
    .eq('id', prdId)
    .eq('workspace_id', workspace.id)
    .single();

  if (!prd) return NextResponse.json({ error: 'PRD not found' }, { status: 404 });

  const token = nanoid(16);
  const { data } = await supabase
    .from('prd_shares')
    .insert({
      prd_id: prdId,
      share_token: token,
      created_by: user.id,
      expires_at: body.expiresAt ?? null,
    })
    .select('share_token')
    .single();

  logActivity({
    workspaceId: workspace.id,
    actorId: user.id,
    type: 'public_share_created',
    resourceType: 'prd',
    resourceId: prdId,
  });

  return NextResponse.json({ token: data?.share_token, url: `/share/${data?.share_token}` });
}
