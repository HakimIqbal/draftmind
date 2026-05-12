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
export function systemLog(params: SystemLogParams): void {
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
