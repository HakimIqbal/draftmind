import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/permissions';

export async function GET(request: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

  const supabase = await createClient();

  // Check if super admin — bypass membership check
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  const isSuperAdmin = profile?.is_super_admin === true;

  if (!isSuperAdmin) {
    // Regular user: verify membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Super admin uses admin client (bypasses RLS), regular user uses scoped client
  const queryClient = isSuperAdmin ? admin : supabase;
  const { data } = await queryClient
    .from('workspace_members')
    .select('user_id, role, joined_at, last_active_at, profiles(full_name, email, avatar_url)')
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true });

  return NextResponse.json({ members: data ?? [] });
}
