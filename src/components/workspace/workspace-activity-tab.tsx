'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import { getWorkspaceActivity } from '@/app/(app)/workspace/settings/actions';

const VERB_MAP: Record<string, string> = {
  prd_created: 'created a PRD',
  prd_edited: 'edited a PRD',
  prd_duplicated: 'duplicated a PRD',
  prd_deleted: 'deleted a PRD',
  prd_status_changed: 'changed PRD status',
  prd_exported: 'exported a PRD',
  prd_pinned: 'pinned/unpinned a PRD',
  prd_version_restored: 'restored a PRD version',
  comment_added: 'added a comment',
  comment_resolved: 'resolved a comment',
  comment_edited: 'edited a comment',
  comment_deleted: 'deleted a comment',
  review_requested: 'requested a review',
  review_approved: 'approved a review',
  ai_generation_started: 'started generating a PRD',
  ai_generation_completed: 'generated a PRD',
  ai_generation_failed: 'failed to generate a PRD',
  ai_review_completed: 'completed AI review',
  ai_copilot_used: 'used AI Copilot',
  ai_suggest_used: 'used AI Suggest',
  member_invited: 'invited a member',
  member_joined: 'joined',
  member_removed: 'removed a member',
  member_role_changed: 'changed a role',
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
};

export function WorkspaceActivityTab({ workspaceId }: { workspaceId: string }) {
  const [activities, setActivities] = useState<
    { id: string; type: string; actor_id: string | null; created_at: string }[]
  >([]);
  const [actorMap, setActorMap] = useState<
    Record<string, { full_name: string | null; avatar_url: string | null }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const workspaceIdRef = useRef(workspaceId);
  workspaceIdRef.current = workspaceId;

  useEffect(() => {
    async function load() {
      setError(null);
      setLoading(true);
      try {
        const result = await getWorkspaceActivity(workspaceId);
        setActivities(result.activities);
        setActorMap(result.actorMap);
      } catch {
        setError('Failed to load activity. Please try again.');
      }
      setLoading(false);
    }
    load();
  }, [workspaceId]);

  // Poll every 30s — only when tab is visible, no loading flicker
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const result = await getWorkspaceActivity(workspaceIdRef.current);
        setActivities(result.activities);
        setActorMap(result.actorMap);
        router.refresh();
      } catch {
        // silent — don't disrupt UI on background poll failure
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [router]);

  if (loading)
    return <p className="py-8 text-center text-[13px] text-[#aaa]">Loading activity...</p>;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <p className="text-[13px] text-[#999]">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setLoading(true);
            getWorkspaceActivity(workspaceId)
              .then((r) => {
                setActivities(r.activities);
                setActorMap(r.actorMap);
              })
              .catch(() => setError('Failed to load activity.'))
              .finally(() => setLoading(false));
          }}
          className="rounded-lg border border-[#eee] px-3 py-1.5 text-[12px] font-medium text-[#666] transition-colors hover:bg-[#f5f5f4]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#eee] bg-white">
      <div className="divide-y divide-[#f5f5f5]">
        {activities.map((a) => {
          const actor = actorMap[a.actor_id ?? ''];
          return (
            <div
              key={a.id}
              className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[#fafaf9]"
            >
              <Avatar
                name={actor?.full_name ?? 'Former member'}
                size="sm"
                avatarUrl={actor?.avatar_url}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-[#555]">
                  <span className="font-medium text-[#1a1a1a]">
                    {actor?.full_name ?? 'Former member'}
                  </span>{' '}
                  {VERB_MAP[a.type] ?? a.type.replace(/_/g, ' ')}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-[#bbb]" suppressHydrationWarning>
                {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
              </span>
            </div>
          );
        })}
        {activities.length === 0 && (
          <div className="px-5 py-16 text-center text-[13px] text-[#aaa]">No activity yet</div>
        )}
      </div>
    </div>
  );
}
