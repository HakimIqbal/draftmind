import { createAdminClient } from '@/lib/supabase/admin';

type LogLevel = 'error' | 'warn' | 'info';

interface SystemLogParams {
  level: LogLevel;
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  workspaceId?: string;
}

/**
 * Write a system log entry to the database.
 * These logs are only visible to super admins, never to regular users.
 * Uses admin client (service role) to bypass RLS.
 *
 * Fire-and-forget — never throws, never blocks the caller.
 */
// Simple in-memory dedup: suppress duplicate log messages within a cooldown window
// to prevent repetitive noise (e.g. repeated trace failures, repeated config warnings).
const _recentLogs = new Map<string, number>();
const DEDUP_WINDOW_MS = 60_000; // 1 minute dedup window

export function systemLog(params: SystemLogParams): void {
  // Dedup: skip if same source+message was logged within the cooldown window
  const dedupKey = `${params.level}:${params.source}:${params.message}`;
  const now = Date.now();
  const lastSeen = _recentLogs.get(dedupKey);
  if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
    return;
  }
  _recentLogs.set(dedupKey, now);

  // Evict stale entries periodically to prevent memory leak
  if (_recentLogs.size > 500) {
    for (const [key, ts] of _recentLogs) {
      if (now - ts > DEDUP_WINDOW_MS * 2) _recentLogs.delete(key);
    }
  }

  const admin = createAdminClient();
  admin
    .from('system_logs')
    .insert({
      level: params.level,
      source: params.source,
      message: params.message,
      metadata: params.metadata ?? {},
      user_id: params.userId ?? null,
      workspace_id: params.workspaceId ?? null,
    })
    .then(({ error }) => {
      if (error) {
        // Last resort — console.error only in server logs, never to user
        console.error('[system-log] Failed to write log:', error.message);
      }
    });
}

/** Shorthand for error level */
export function logError(
  source: string,
  message: string,
  metadata?: Record<string, unknown>,
  userId?: string,
) {
  systemLog({ level: 'error', source, message, metadata, userId });
}

/** Shorthand for warn level */
export function logWarn(
  source: string,
  message: string,
  metadata?: Record<string, unknown>,
  userId?: string,
) {
  systemLog({ level: 'warn', source, message, metadata, userId });
}

/** Shorthand for info level */
export function logInfo(
  source: string,
  message: string,
  metadata?: Record<string, unknown>,
  userId?: string,
) {
  systemLog({ level: 'info', source, message, metadata, userId });
}
