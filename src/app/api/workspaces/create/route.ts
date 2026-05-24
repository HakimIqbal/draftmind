import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logError } from '@/lib/logging/system-log';
import { logActivity } from '@/lib/logging/activity-log';
import {
  CURRENT_WORKSPACE_COOKIE,
  CURRENT_WORKSPACE_COOKIE_OPTIONS,
} from '@/lib/workspace/current-workspace-cookie';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { name?: string; industry?: string; team_size?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = (body.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'Workspace name required' }, { status: 400 });

  const admin = createAdminClient();

  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Date.now().toString(36);

  const { data: ws, error } = await admin
    .from('workspaces')
    .insert({
      name,
      slug,
      owner_id: user.id,
      industry: body.industry || null,
      team_size: body.team_size || null,
    })
    .select('id')
    .single();

  if (error || !ws) {
    logError('api.workspaces.create', error?.message ?? 'Unknown', { name }, user.id);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 400 });
  }

  const { error: memErr } = await admin.from('workspace_members').insert({
    workspace_id: ws.id,
    user_id: user.id,
    role: 'admin',
  });

  if (memErr) {
    logError('api.workspaces.create.member', memErr.message, { workspaceId: ws.id }, user.id);
    return NextResponse.json({ error: 'Failed to create workspace member' }, { status: 400 });
  }

  await logActivity({
    workspaceId: ws.id,
    actorId: user.id,
    type: 'workspace_created',
    resourceType: 'workspace',
    resourceId: ws.id,
    metadata: { name },
  });

  const response = NextResponse.json({ workspaceId: ws.id });
  response.cookies.set(CURRENT_WORKSPACE_COOKIE, ws.id, CURRENT_WORKSPACE_COOKIE_OPTIONS);
  return response;
}
