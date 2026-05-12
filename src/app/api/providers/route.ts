import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';
import { encryptApiKey } from '@/lib/utils/crypto';

export async function GET(request: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

  const supabase = await createClient();

  // Verify user is member of this workspace
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data } = await supabase
    .from('providers')
    .select('id, provider_type, display_name, status, is_default, model, base_url, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  return NextResponse.json({ providers: data ?? [] });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json();
  const supabase = await createClient();

  // Verify user is admin of this workspace
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', body.workspaceId)
    .eq('user_id', user.id)
    .single();

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('providers')
    .insert({
      workspace_id: body.workspaceId,
      provider_type: body.providerType,
      display_name: body.displayName,
      api_key_encrypted: encryptApiKey(body.apiKey),
      base_url: body.baseUrl ?? null,
      model: body.model ?? null,
      is_default: body.isDefault ?? false,
      status: 'active',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to add provider' }, { status: 400 });
  return NextResponse.json({ provider: data });
}
