export type ActivityType =
  | 'prd_created'
  | 'prd_edited'
  | 'prd_duplicated'
  | 'prd_deleted'
  | 'prd_status_changed'
  | 'prd_exported'
  | 'prd_pinned'
  | 'prd_version_restored'
  | 'comment_added'
  | 'comment_resolved'
  | 'comment_edited'
  | 'comment_deleted'
  | 'review_requested'
  | 'review_approved'
  | 'review_rejected'
  | 'ai_generation_completed'
  | 'ai_review_completed'
  | 'ai_refinement_applied'
  | 'ai_copilot_used'
  | 'ai_suggest_used'
  | 'member_invited'
  | 'member_joined'
  | 'member_role_changed'
  | 'member_removed'
  | 'member_invitation_revoked'
  | 'workspace_created'
  | 'workspace_settings_changed'
  | 'workspace_left'
  | 'workspace_deleted'
  | 'workspace_ownership_transferred'
  | 'provider_added'
  | 'provider_disconnected'
  | 'template_created'
  | 'template_updated'
  | 'template_deleted'
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
