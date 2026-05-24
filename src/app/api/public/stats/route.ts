import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  try {
    const admin = createAdminClient();
    const { count, error } = await admin
      .from('prd_templates')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('[api/public/stats] template count error:', error);
      return NextResponse.json({ templateCount: null }, { status: 200 });
    }

    return NextResponse.json(
      { templateCount: count ?? 0 },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    );
  } catch (error) {
    console.error('[api/public/stats] unexpected error:', error);
    return NextResponse.json({ templateCount: null }, { status: 200 });
  }
}
