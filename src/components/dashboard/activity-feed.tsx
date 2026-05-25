import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import type { ActivityFeedItem } from '@/lib/db/queries/dashboard';

// Must match activity_type enum in DB
const VERB_MAP: Record<string, string> = {
  prd_created: 'created',
  prd_edited: 'edited',
  prd_duplicated: 'duplicated',
  prd_deleted: 'deleted',
  prd_exported: 'exported',
  prd_status_changed: 'changed status for',
  prd_pinned: 'pinned/unpinned',
  prd_version_restored: 'restored a version of',
  comment_added: 'commented on',
  comment_resolved: 'resolved a comment in',
  comment_edited: 'edited a comment in',
  comment_deleted: 'deleted a comment in',
  review_requested: 'requested review for',
  ai_copilot_used: 'used AI Copilot on',
  ai_suggest_used: 'used AI Assist on',
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
  public_share_created: 'created a share link for',
  user_banned: 'banned a user',
  user_unbanned: 'unbanned a user',
  user_created_by_admin: 'created a user',
  super_admin_toggled: 'toggled admin status',
};

function getVerb(type: string): string {
  return VERB_MAP[type] ?? type.replace(/_/g, ' ');
}

function getResourceLabel(item: ActivityFeedItem): string | null {
  const metadata = item.metadata ?? {};
  const title =
    metadata.prd_title ?? metadata.title ?? metadata.prdTitle ?? metadata.resource_title;

  return typeof title === 'string' && title.trim().length > 0 ? title : null;
}

function getDetail(item: ActivityFeedItem): string | null {
  const metadata = item.metadata ?? {};
  const section = metadata.section ?? metadata.section_key ?? metadata.sectionName;
  const status = metadata.status ?? metadata.to_status ?? metadata.new_status;
  const action = metadata.action ?? metadata.ai_action;

  if (typeof section === 'string' && section) return `Section: ${section}`;
  if (typeof status === 'string' && status) return `Status: ${status}`;
  if (typeof action === 'string' && action) return `Action: ${action.replace(/_/g, ' ')}`;
  return null;
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
          const resourceLabel = getResourceLabel(item);
          const detail = getDetail(item);

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
                <p className="text-[12px] leading-5 text-[#555]">
                  <span className="font-medium text-[#1a1a1a]">{name}</span> {getVerb(item.type)}
                  {resourceLabel && (
                    <span className="font-medium text-[#1a1a1a]"> {resourceLabel}</span>
                  )}
                </p>
                {detail && <p className="truncate text-[11px] text-[#999]">{detail}</p>}
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
