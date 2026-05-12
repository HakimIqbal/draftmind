import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, workspaceId, role } = body;
  if (!email || !workspaceId) {
    return NextResponse.json({ error: 'email and workspaceId are required' }, { status: 400 });
  }

  // Check if user is a member of the workspace
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    return NextResponse.json(
      { error: 'Only owners and admins can invite members' },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from('workspace_invitations')
    .insert({
      workspace_id: workspaceId,
      email,
      role: role ?? 'editor',
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to send invitation' }, { status: 400 });
  return NextResponse.json({ invitation: data });
}
