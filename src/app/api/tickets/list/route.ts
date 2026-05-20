import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[tickets/list] failed', error);
      return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 });
    }

    return NextResponse.json({ tickets: data ?? [] });
  } catch (error) {
    console.error('[tickets/list] unexpected', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
