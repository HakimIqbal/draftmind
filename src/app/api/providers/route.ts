import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspaceId');
  if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('providers')
    .select('id, provider_type, display_name, status, is_default, model, base_url, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  return NextResponse.json({ providers: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('providers')
    .insert({
      workspace_id: body.workspaceId,
      provider_type: body.providerType,
      display_name: body.displayName,
      api_key_encrypted: body.apiKey,
      base_url: body.baseUrl ?? null,
      model: body.model ?? null,
      is_default: body.isDefault ?? false,
      status: 'active',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ provider: data });
}
