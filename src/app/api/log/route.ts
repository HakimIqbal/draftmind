import { createClient } from '@/lib/supabase/server';
import { logError, logWarn } from '@/lib/logging/system-log';

export async function POST(request: Request) {
  try {
    // Auth check — only logged-in users can post logs
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { level, source, message, metadata } = await request.json();

    if (!source || !message) {
      return Response.json({ ok: false }, { status: 400 });
    }

    if (level === 'warn') {
      logWarn(source, message, metadata, user.id);
    } else {
      logError(source, message, metadata, user.id);
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
