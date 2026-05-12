import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import type { ActivityFeedItem } from '@/lib/db/queries/dashboard';

// Must match activity_type enum in DB
const VERB_MAP: Record<string, string> = {
  prd_created: 'created a PRD',
  prd_edited: 'edited a PRD',
  prd_duplicated: 'duplicated a PRD',
  prd_deleted: 'deleted a PRD',
  prd_exported: 'exported a PRD',
  prd_status_changed: 'changed PRD status',
  prd_pinned: 'pinned/unpinned a PRD',
  prd_version_restored: 'restored a PRD version',
  comment_added: 'commented',
  comment_resolved: 'resolved a comment',
  comment_edited: 'edited a comment',
  comment_deleted: 'deleted a comment',
  review_requested: 'requested a review',
  ai_copilot_used: 'used AI Copilot',
  ai_suggest_used: 'used AI Suggest',
  member_invited: 'invited a member',
  member_joined: 'joined the workspace',
  member_role_changed: 'changed a member role',
  member_removed: 'removed a member',
  member_invitation_revoked: 'revoked an invitation',
  workspace_created: 'created a workspace',
  workspace_settings_changed: 'updated workspace settings',
  workspace_deleted: 'deleted a workspace',
  workspace_left: 'left the workspace',
  workspace_ownership_transferred: 'transferred ownership',
  provider_added: 'added a provider',
  provider_disconnected: 'disconnected a provider',
  provider_set_default: 'set default provider',
  template_created: 'created a template',
  template_updated: 'updated a template',
  template_deleted: 'deleted a template',
  login: 'logged in',
  logout: 'logged out',
  profile_updated: 'updated their profile',
  password_changed: 'changed their password',
  password_reset: 'reset a user password',
  public_share_created: 'created a share link',
  user_banned: 'banned a user',
  user_unbanned: 'unbanned a user',
  user_created_by_admin: 'created a user',
  super_admin_toggled: 'toggled admin status',
};

function getVerb(type: string): string {
  return VERB_MAP[type] ?? type.replace(/_/g, ' ');
}

export function ActivityFeed({ items }: { items: ActivityFeedItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[#eee] bg-white px-5 py-10 text-center">
        <p className="text-[13px] text-[#aaa]">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#eee] bg-white">
      <div className="divide-y divide-[#f5f5f5]">
        {items.map((item) => {
          const name = item.actor?.full_name ?? 'Former member';
          return (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3">
              <Avatar
                name={name}
                size="sm"
                seed={item.actor?.avatar_color_seed ?? undefined}
                avatarUrl={
                  (item.actor as Record<string, unknown> | null)?.avatar_url as string | null
                }
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-[#555]">
                  <span className="font-medium text-[#1a1a1a]">{name}</span> {getVerb(item.type)}
                </p>
                <span className="text-[11px] text-[#bbb]" suppressHydrationWarning>
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
