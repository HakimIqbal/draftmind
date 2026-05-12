import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Send a notification to a user. Fire-and-forget — never throws.
 */
export function sendNotification({
  recipientId,
  workspaceId,
  type,
  title,
  body,
  resourceType,
  resourceId,
  actionUrl,
}: {
  recipientId: string;
  workspaceId: string;
  type: string;
  title: string;
  body: string;
  resourceType?: string;
  resourceId?: string;
  actionUrl?: string;
}): void {
  const admin = createAdminClient();
  void admin
    .from('notifications')
    .insert({
      recipient_id: recipientId,
      workspace_id: workspaceId,
      type,
      title,
      body,
      resource_type: resourceType ?? null,
      resource_id: resourceId ?? null,
      action_url: actionUrl ?? null,
    })
    .then(
      ({ error }) => {
        if (error) {
          console.error(
            `[notification] FAILED to send "${type}" to ${recipientId}:`,
            error.message,
          );
        }
      },
      (err) => {
        console.error(`[notification] EXCEPTION sending "${type}":`, err);
      },
    );
}
