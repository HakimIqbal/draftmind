import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

export async function POST(request: Request, { params }: { params: Promise<{ prdId: string }> }) {
  const { prdId } = await params;
  const body = await request.json();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  return NextResponse.json({ token: data?.share_token, url: `/share/${data?.share_token}` });
}
