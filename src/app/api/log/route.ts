import { createClient } from '@/lib/supabase/server';
import { logError, logInfo, logWarn } from '@/lib/logging/system-log';

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

    let payload: unknown;
    try {
      payload = await request.json();
    } catch (error) {
      logInfo(
        'api.log.parse_failed',
        'Client log payload could not be parsed',
        { error: error instanceof Error ? error.message : 'Unknown parse error' },
        user.id,
      );
      return Response.json({ ok: false }, { status: 400 });
    }

    const { level, source, message, metadata } = payload as {
      level?: string;
      source?: string;
      message?: string;
      metadata?: Record<string, unknown>;
    };

    if (!source || !message) {
      logInfo(
        'api.log.validation_failed',
        'Client log payload missing source/message',
        {},
        user.id,
      );
      return Response.json({ ok: false }, { status: 400 });
    }

    if (level === 'warn') {
      logWarn(source, message, metadata, user.id);
    } else {
      logError(source, message, metadata, user.id);
    }

    return Response.json({ ok: true });
  } catch (error) {
    logWarn(
      'api.log.failed',
      error instanceof Error ? error.message : 'Failed to ingest client log',
      {},
    );
    return Response.json({ ok: false }, { status: 500 });
  }
}
