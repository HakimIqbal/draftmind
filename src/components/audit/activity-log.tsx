'use client';

import { useState, useMemo } from 'react';
import { Chip } from '@/components/ui/chip';
import { Avatar } from '@/components/ui/avatar';
import { Sparkle } from '@/components/icons/sparkle';
import Link from 'next/link';

interface ActivityEntry {
  id: string;
  activity_type: string;
  actor_name: string | null;
  actor_id: string | null;
  resource_type: string | null;
  resource_id: string | null;
  resource_title: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

type FilterKey = 'all' | 'prd' | 'ai' | 'member';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'prd', label: 'PRD events' },
  { key: 'ai', label: 'AI events' },
  { key: 'member', label: 'Member events' },
];

// Must match activity_type enum in DB
const VERB_MAP: Record<string, string> = {
  prd_created: 'created',
  prd_edited: 'edited',
  prd_duplicated: 'duplicated',
  prd_deleted: 'deleted',
  prd_exported: 'exported',
  prd_status_changed: 'changed status of',
  prd_pinned: 'pinned/unpinned',
  prd_version_restored: 'restored version of',
  comment_added: 'commented on',
  comment_resolved: 'resolved comment on',
  comment_edited: 'edited comment on',
  comment_deleted: 'deleted comment on',
  ai_generation_completed: 'generated',
  ai_review_completed: 'reviewed',
  ai_refinement_applied: 'refined',
  ai_copilot_used: 'used Copilot on',
  ai_suggest_used: 'used AI Suggest on',
  member_invited: 'invited a member to',
  member_joined: 'joined',
  member_removed: 'removed a member from',
  member_role_changed: 'changed role in',
  member_invitation_revoked: 'revoked invitation in',
  workspace_created: 'created',
  workspace_settings_changed: 'updated settings of',
  workspace_deleted: 'deleted',
  workspace_left: 'left',
  workspace_ownership_transferred: 'transferred ownership of',
  provider_added: 'added provider to',
  provider_disconnected: 'disconnected provider from',
  provider_set_default: 'set default provider in',
  template_created: 'created a template in',
  template_updated: 'updated a template in',
  template_deleted: 'deleted a template in',
  login: 'logged in',
  logout: 'logged out',
  profile_updated: 'updated profile',
  password_changed: 'changed password',
  password_reset: 'reset password for',
  public_share_created: 'shared',
  public_share_viewed: 'viewed shared',
  user_banned: 'banned a user',
  user_unbanned: 'unbanned a user',
  user_created_by_admin: 'created a user',
  super_admin_toggled: 'toggled admin status',
};

const AI_TYPES = new Set([
  'ai_generation_completed',
  'ai_review_completed',
  'ai_refinement_applied',
]);

const MEMBER_TYPES = new Set([
  'member_invited',
  'member_joined',
  'member_removed',
  'member_role_changed',
]);

function isAiEvent(type: string) {
  return AI_TYPES.has(type);
}

function filterMatches(entry: ActivityEntry, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'ai') return AI_TYPES.has(entry.activity_type);
  if (filter === 'member') return MEMBER_TYPES.has(entry.activity_type);
  if (filter === 'prd') return entry.activity_type.startsWith('prd_');
  return true;
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return '1d ago';
  return `${diffDays}d ago`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - target.getTime();
  const dayMs = 86400000;
  if (diff < dayMs) return 'TODAY';
  if (diff < dayMs * 2) return 'YESTERDAY';
  return d
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

function groupByDate(entries: ActivityEntry[]): [string, ActivityEntry[]][] {
  const groups = new Map<string, ActivityEntry[]>();
  for (const entry of entries) {
    const label = getDateLabel(entry.created_at);
    const existing = groups.get(label);
    if (existing) {
      existing.push(entry);
    } else {
      groups.set(label, [entry]);
    }
  }
  return Array.from(groups.entries());
}

function getResourceHref(entry: ActivityEntry): string | null {
  if (entry.resource_type === 'prd' && entry.resource_id) {
    return `/prds/${entry.resource_id}`;
  }
  return null;
}

export function ActivityLog({ entries }: { entries: ActivityEntry[] }) {
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(
    () => entries.filter((e) => filterMatches(e, filter)),
    [entries, filter],
  );

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div>
      <h1 className="text-lg font-semibold text-ink-primary">Activity log</h1>

      <div className="mt-md flex items-center gap-xs border-b border-subtle">
        {FILTERS.map((f) => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {grouped.length === 0 ? (
        <p className="mt-xl text-center text-sm text-ink-tertiary">No activity yet</p>
      ) : (
        <div className="mt-md space-y-lg">
          {grouped.map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p
                className="font-mono text-[11px] uppercase text-ink-tertiary"
                suppressHydrationWarning
              >
                {dateLabel}
              </p>
              <div className="mt-sm space-y-px">
                {items.map((entry) => {
                  const verb = VERB_MAP[entry.activity_type] ?? entry.activity_type;
                  const href = getResourceHref(entry);
                  const ai = isAiEvent(entry.activity_type);

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-sm rounded-md px-sm py-1.5 transition-colors hover:bg-bg-surface"
                    >
                      <span
                        className="w-10 shrink-0 font-mono text-[11px] text-ink-tertiary"
                        suppressHydrationWarning
                      >
                        {formatTime(entry.created_at)}
                      </span>

                      {ai ? (
                        <Sparkle size={20} className="shrink-0" />
                      ) : (
                        <Avatar name={entry.actor_name ?? 'Former member'} size="sm" />
                      )}

                      <span className="min-w-0 flex-1 truncate text-sm text-ink-secondary">
                        <span className="font-medium text-ink-primary">
                          {ai ? 'AI' : (entry.actor_name ?? 'Former member')}
                        </span>{' '}
                        {verb}{' '}
                        {href && entry.resource_title ? (
                          <Link
                            href={href}
                            className="decoration-subtle font-medium text-ink-primary underline underline-offset-2 hover:decoration-ink-secondary"
                          >
                            {entry.resource_title}
                          </Link>
                        ) : (
                          entry.resource_title && (
                            <span className="font-medium text-ink-primary">
                              {entry.resource_title}
                            </span>
                          )
                        )}
                      </span>

                      <span className="shrink-0 font-mono text-[11px] text-ink-tertiary">
                        {formatRelativeTime(entry.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
