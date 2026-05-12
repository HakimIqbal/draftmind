import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Log a user action to activity_log. Fire-and-forget — never throws.
 */
export function logActivity({
  workspaceId,
  actorId,
  type,
  resourceType,
  resourceId,
  metadata,
}: {
  workspaceId: string;
  actorId: string;
  type: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}): void {
  const admin = createAdminClient();
  void admin
    .from('activity_log')
    .insert({
      workspace_id: workspaceId,
      actor_id: actorId,
      type,
      resource_type: resourceType ?? null,
      resource_id: resourceId ?? null,
      metadata: metadata ?? {},
    })
    .then(
      ({ error }) => {
        if (error) {
          console.error(`[activity-log] FAILED to log "${type}":`, error.message, {
            workspaceId,
            actorId,
            resourceId,
          });
        }
      },
      (err) => {
        console.error(`[activity-log] EXCEPTION logging "${type}":`, err);
      },
    );
}
