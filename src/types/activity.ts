export type ActivityType =
  | 'prd_created'
  | 'prd_edited'
  | 'prd_status_changed'
  | 'prd_archived'
  | 'prd_exported'
  | 'comment_added'
  | 'comment_resolved'
  | 'review_requested'
  | 'review_approved'
  | 'review_rejected'
  | 'ai_generation_completed'
  | 'ai_review_completed'
  | 'ai_refinement_applied'
  | 'member_invited'
  | 'member_joined'
  | 'member_role_changed'
  | 'member_removed'
  | 'workspace_created'
  | 'workspace_settings_changed'
  | 'provider_added'
  | 'provider_disconnected'
  | 'login'
  | 'logout'
  | 'public_share_created'
  | 'public_share_viewed';

export interface ActivityLogEntry {
  id: string;
  workspace_id: string;
  actor_id: string | null;
  type: ActivityType;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
