import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const nowIso = new Date().toISOString();
  const admin = createAdminClient();

  await Promise.allSettled([
    admin.from('profiles').update({ last_seen_at: nowIso }).eq('id', user.id),
    admin.from('workspace_members').update({ last_active_at: nowIso }).eq('user_id', user.id),
  ]);

  return NextResponse.json({ ok: true, at: nowIso });
}
