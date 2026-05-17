'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import { ChevronDown, X } from 'lucide-react';
import { fetchActivityLog } from './actions';

// Must match activity_type enum in DB
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
  review_rejected: 'rejected a review',
  ai_generation_completed: 'completed AI generation',
  ai_review_completed: 'completed AI review',
  ai_refinement_applied: 'applied AI refinement',
  ai_copilot_used: 'used AI Copilot',
  ai_suggest_used: 'used AI Suggest',
  member_invited: 'invited a member',
  member_joined: 'joined the workspace',
  member_role_changed: 'changed a member role',
  member_removed: 'removed a member',
  member_invitation_revoked: 'revoked an invitation',
  workspace_created: 'created a workspace',
  workspace_settings_changed: 'changed workspace settings',
  workspace_deleted: 'deleted a workspace',
  workspace_left: 'left a workspace',
  workspace_ownership_transferred: 'transferred workspace ownership',
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
  public_share_viewed: 'viewed a shared PRD',
  user_banned: 'banned a user',
  user_unbanned: 'unbanned a user',
  user_created_by_admin: 'created a user',
  super_admin_toggled: 'toggled super admin status',
};

type FilterKey = 'all' | 'error' | 'warn' | 'info';

// Categorize by severity — Error=broken/failed, Warning=suspicious/attention, Info=normal
const ERROR_TYPES = new Set(['review_rejected', 'provider_disconnected', 'workspace_deleted']);
const WARN_TYPES = new Set([
  'login_failed',
  'member_invitation_revoked',
  'workspace_ownership_transferred',
]);
// Everything else = info

function getCategory(type: string): 'error' | 'warn' | 'info' {
  if (ERROR_TYPES.has(type)) return 'error';
  if (WARN_TYPES.has(type)) return 'warn';
  return 'info';
}

const CATEGORY_DOT: Record<string, string> = {
  error: 'bg-red-400',
  warn: 'bg-amber-400',
  info: 'bg-blue-400',
};

const CATEGORY_BADGE: Record<string, string> = {
  error: 'bg-red-50 text-red-600 border-red-100',
  warn: 'bg-amber-50 text-amber-600 border-amber-100',
  info: 'bg-blue-50 text-blue-600 border-blue-100',
};

interface Activity {
  id: string;
  type: string;
  actor_id: string | null;
  workspace_id: string | null;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface Props {
  initialActivities: Activity[];
  initialActorMap: Record<
    string,
    { id: string; full_name: string | null; email: string | null; avatar_url: string | null }
  >;
  initialWsMap: Record<string, { id: string; name: string }>;
}

export function ActivityLogTable({ initialActivities, initialActorMap, initialWsMap }: Props) {
  const [activities, setActivities] = useState(initialActivities);
  const [actorMap, setActorMap] = useState(initialActorMap);
  const [wsMap, setWsMap] = useState(initialWsMap);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Auto-refresh every 30s — only when tab is visible
  const refresh = useCallback(async () => {
    try {
      const result = await fetchActivityLog();
      setActivities(result.activities);
      setActorMap(result.actorMap);
      setWsMap(result.wsMap);
    } catch {
      /* stale action */
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      refresh();
    }, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Filter
  const filtered = activities.filter((a) => {
    if (selectedUser && a.actor_id !== selectedUser) return false;
    if (filter === 'all') return true;
    return getCategory(a.type) === filter;
  });

  // Count per category
  const counts = { all: activities.length, error: 0, warn: 0, info: 0 };
  activities.forEach((a) => {
    const cat = getCategory(a.type);
    counts[cat]++;
  });

  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'error', label: 'Error', count: counts.error },
    { key: 'warn', label: 'Warning', count: counts.warn },
    { key: 'info', label: 'Info', count: counts.info },
  ];

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-[#eee] bg-white p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all ${
                filter === f.key
                  ? 'bg-[#f5f5f4] text-[#1a1a1a] shadow-sm'
                  : 'text-[#888] hover:text-[#555]'
              }`}
            >
              {f.key !== 'all' && (
                <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[f.key]}`} />
              )}
              {f.label}
              <span className="ml-0.5 text-[10px] text-[#bbb]">{f.count}</span>
            </button>
          ))}
        </div>

        {selectedUser && (
          <button
            onClick={() => setSelectedUser(null)}
            className="flex items-center gap-1.5 rounded-lg border border-[#eee] bg-white px-3 py-1.5 text-[12px] text-[#555] hover:bg-[#f5f5f4]"
          >
            <Avatar
              name={actorMap[selectedUser]?.full_name ?? 'User'}
              size="sm"
              avatarUrl={actorMap[selectedUser]?.avatar_url}
            />
            {actorMap[selectedUser]?.full_name ?? 'User'}
            <X size={12} className="ml-1 text-[#ccc]" />
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-[11px] text-[#bbb]">Live · {filtered.length} activities</span>
        </div>
      </div>

      {/* Activity list */}
      <div className="rounded-xl border border-[#eee] bg-white">
        <div className="divide-y divide-[#f5f5f5]">
          {filtered.map((a) => {
            const actor = actorMap[a.actor_id ?? ''];
            const ws = wsMap[a.workspace_id ?? ''];
            const cat = getCategory(a.type);
            const isExpanded = expandedId === a.id;

            return (
              <div key={a.id}>
                {/* Main row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                  className="flex cursor-pointer items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[#fafaf9]"
                >
                  {/* Category dot */}
                  <span className={`h-2 w-2 shrink-0 rounded-full ${CATEGORY_DOT[cat]}`} />

                  {/* Avatar — click to filter by user */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUser(a.actor_id === selectedUser ? null : a.actor_id);
                    }}
                  >
                    <Avatar
                      name={actor?.full_name ?? 'Former member'}
                      size="sm"
                      avatarUrl={actor?.avatar_url}
                    />
                  </button>

                  {/* Description */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-[#555]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(a.actor_id === selectedUser ? null : a.actor_id);
                        }}
                        className="font-medium text-[#1a1a1a] hover:underline"
                      >
                        {actor?.full_name ?? 'Former member'}
                      </button>{' '}
                      {VERB_MAP[a.type] ?? a.type.replace(/_/g, ' ')}
                    </p>
                    {ws && <p className="text-[11px] text-[#bbb]">{ws.name}</p>}
                  </div>

                  {/* Category badge */}
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${CATEGORY_BADGE[cat]}`}
                  >
                    {a.type.replace(/_/g, ' ')}
                  </span>

                  {/* Time */}
                  <span className="shrink-0 whitespace-nowrap text-[11px] text-[#bbb]">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </span>

                  {/* Expand arrow */}
                  <ChevronDown
                    size={14}
                    className={`shrink-0 text-[#ccc] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Detail panel */}
                {isExpanded && (
                  <div className="border-t border-[#f0f0f0] bg-[#fafaf9] px-5 py-4">
                    <div className="grid grid-cols-3 gap-4 text-[12px]">
                      <div>
                        <p className="text-[10px] font-medium uppercase text-[#aaa]">Actor</p>
                        <p className="mt-1 text-[#555]">
                          {actor?.full_name ?? 'Former member'}
                          {actor?.email && (
                            <span className="ml-1 text-[#bbb]">({actor.email})</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase text-[#aaa]">
                          Activity Type
                        </p>
                        <p className="mt-1 text-[#555]">{a.type}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase text-[#aaa]">Workspace</p>
                        <p className="mt-1 text-[#555]">{ws?.name ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase text-[#aaa]">Resource</p>
                        <p className="mt-1 text-[#555]">
                          {a.resource_type ?? '-'}
                          {a.resource_id && (
                            <span className="ml-1 text-[#bbb]">
                              ({a.resource_id.slice(0, 8)}...)
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase text-[#aaa]">Timestamp</p>
                        <p className="mt-1 text-[#555]" suppressHydrationWarning>
                          {new Date(a.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase text-[#aaa]">Category</p>
                        <p className="mt-1">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${CATEGORY_BADGE[cat]}`}
                          >
                            {cat.toUpperCase()}
                          </span>
                        </p>
                      </div>
                      {a.metadata && Object.keys(a.metadata).length > 0 && (
                        <div className="col-span-3">
                          <p className="text-[10px] font-medium uppercase text-[#aaa]">Metadata</p>
                          <pre className="mt-1 overflow-x-auto rounded-md bg-white p-2 font-mono text-[11px] text-[#555]">
                            {JSON.stringify(a.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-5 py-16 text-center text-[13px] text-[#aaa]">
              No activity matches the current filter
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
