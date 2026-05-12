'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Users as UsersIcon,
  Settings,
  Activity,
  MoreHorizontal,
  Search,
  UserPlus,
  Mail,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { InviteModal } from '@/components/workspace/invite-modal';
import {
  changeRole,
  removeMember,
  resendInvitation,
  revokeInvitation,
} from '@/app/(app)/workspace/members/actions';
import {
  updateWorkspaceSettings,
  leaveWorkspace,
  deleteWorkspace,
  getWorkspaceActivity,
} from '@/app/(app)/workspace/settings/actions';
import type { WorkspaceMemberItem, WorkspaceInvitationItem } from '@/app/(app)/workspace/page';

const INDUSTRY_OPTIONS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'E-commerce',
  'Media',
  'Gaming',
  'Consulting',
  'Government',
  'Other',
];
const TEAM_SIZE_OPTIONS = ['1-5', '6-20', '21-50', '51-200', '200+'];

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
  ai_generation_completed: 'generated a PRD',
  ai_review_completed: 'completed AI review',
  ai_copilot_used: 'used AI Copilot',
  ai_suggest_used: 'used AI Suggest',
  login: 'logged in',
  logout: 'logged out',
  profile_updated: 'updated their profile',
  password_changed: 'changed their password',
  public_share_created: 'created a share link',
};

function relativeTime(d: string | null): string {
  if (!d) return 'Never';
  const ms = Date.now() - new Date(d).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function isOnline(d: string | null) {
  return d ? Date.now() - new Date(d).getTime() < 300000 : false;
}

interface Props {
  workspace: {
    id: string;
    name: string;
    slug: string;
    industry: string | null;
    team_size: string | null;
    owner_id: string;
    created_at: string;
  };
  currentUserId: string;
  currentUserRole: string;
  isOwner: boolean;
  members: WorkspaceMemberItem[];
  invitations: WorkspaceInvitationItem[];
}

type Tab = 'members' | 'settings' | 'activity';

export function WorkspaceHub({
  workspace,
  currentUserId,
  currentUserRole,
  isOwner,
  members,
  invitations,
}: Props) {
  const router = useRouter();
  const isAdmin = currentUserRole === 'admin';
  const [tab, setTab] = useState<Tab>('members');
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const tabs: { key: Tab; label: string; icon: React.ElementType; show: boolean }[] = [
    { key: 'members', label: 'Members', icon: UsersIcon, show: true },
    { key: 'settings', label: 'Settings', icon: Settings, show: isAdmin },
    { key: 'activity', label: 'Activity', icon: Activity, show: isAdmin },
  ];

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">{workspace.name}</h1>
        <p className="mt-0.5 text-[13px] text-[#888]" suppressHydrationWarning>
          {workspace.industry ?? 'No industry'} ·{' '}
          {workspace.team_size ? `${workspace.team_size} people` : 'Team size not set'} · Created{' '}
          {workspace.created_at
            ? formatDistanceToNow(new Date(workspace.created_at), { addSuffix: true })
            : '—'}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 border-b border-[#eee]">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                tab === t.key
                  ? 'border-[#1a1a1a] text-[#1a1a1a]'
                  : 'border-transparent text-[#999] hover:text-[#555]'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        <span className="ml-auto text-[11px] text-[#bbb]">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tab content */}
      {tab === 'members' && (
        <MembersTab
          workspaceId={workspace.id}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          isOwner={isOwner}
          members={members}
          invitations={invitations}
          isPending={isPending}
          startTransition={startTransition}
          mounted={mounted}
        />
      )}
      {tab === 'settings' && isAdmin && (
        <SettingsTab
          workspace={workspace}
          isOwner={isOwner}
          isPending={isPending}
          startTransition={startTransition}
          router={router}
        />
      )}
      {tab === 'activity' && isAdmin && <ActivityTab workspaceId={workspace.id} />}
    </div>
  );
}

/* ─── Members Tab ─── */

function MembersTab({
  workspaceId,
  currentUserId,
  isAdmin,
  isOwner: _isOwner,
  members,
  invitations,
  isPending,
  startTransition,
  mounted,
}: {
  workspaceId: string;
  currentUserId: string;
  isAdmin: boolean;
  isOwner: boolean;
  members: WorkspaceMemberItem[];
  invitations: WorkspaceInvitationItem[];
  isPending: boolean;
  startTransition: (cb: () => Promise<void>) => void;
  mounted: boolean;
}) {
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (m.profile?.full_name?.toLowerCase().includes(q) ?? false) ||
      (m.profile?.email?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#bbb]" />
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus:ring-accent/30 h-9 w-full rounded-lg border border-[#e5e5e3] bg-white pl-9 pr-3 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
          />
        </div>
        {isAdmin && (
          <button
            onClick={() => setInviteOpen(true)}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#eee]">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-[#f0f0f0] bg-[#fafaf9]">
              <th className="whitespace-nowrap px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Member
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Role
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Permission
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Last active
              </th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((member) => {
              const name = member.profile?.full_name ?? 'Unknown';
              const email = member.profile?.email ?? '';
              const role = member.profile?.role_self_reported ?? null;
              const isSelf = member.user_id === currentUserId;
              const online = mounted && isOnline(member.last_active_at);
              return (
                <tr
                  key={member.user_id}
                  className="border-b border-[#f5f5f5] transition-colors hover:bg-[#fafaf9]"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar
                          name={name}
                          size="sm"
                          seed={member.profile?.avatar_color_seed ?? undefined}
                          avatarUrl={member.profile?.avatar_url}
                        />
                        {online && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-[#1a1a1a]">
                          {name}
                          {isSelf && <span className="ml-1.5 text-[10px] text-[#bbb]">you</span>}
                        </p>
                        <p className="truncate text-[11px] text-[#aaa]">{email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="text-[12px] text-[#666]">{role ?? '—'}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    {isAdmin && !isSelf ? (
                      <Select
                        value={member.role}
                        onValueChange={(val) =>
                          startTransition(async () => {
                            await changeRole(
                              workspaceId,
                              member.user_id,
                              val as 'admin' | 'editor' | 'commenter' | 'viewer',
                            );
                          })
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-7 w-[120px] text-[12px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="commenter">Commenter</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${member.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-[#f5f5f4] text-[#888]'}`}
                      >
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${online ? 'bg-emerald-400' : member.last_active_at ? 'bg-[#ddd]' : 'bg-amber-400'}`}
                      />
                      <span className="text-[12px] text-[#999]">
                        {online ? 'Online now' : relativeTime(member.last_active_at)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    {isAdmin && !isSelf && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="rounded-md p-1 text-[#ccc] hover:text-[#666]">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() =>
                              startTransition(async () => {
                                await removeMember(workspaceId, member.user_id);
                              })
                            }
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-[13px] text-[#aaa]">
                  No members found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {invitations.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[#aaa]">
            Pending invitations
          </p>
          <div className="overflow-hidden rounded-xl border border-[#eee]">
            <table className="w-full">
              <tbody>
                {invitations.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-[#f5f5f5] transition-colors hover:bg-[#fafaf9]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50">
                          <Mail size={13} className="text-amber-500" />
                        </div>
                        <span className="text-[13px] text-[#1a1a1a]">{inv.email}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="text-[13px] capitalize text-[#666]">{inv.role}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-500">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                        Pending
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              startTransition(async () => {
                                await resendInvitation(workspaceId, inv.id);
                              })
                            }
                            disabled={isPending}
                            className="text-[12px] text-[#999] hover:text-[#555]"
                          >
                            Resend
                          </button>
                          <button
                            onClick={() =>
                              startTransition(async () => {
                                await revokeInvitation(workspaceId, inv.id);
                              })
                            }
                            disabled={isPending}
                            className="text-[12px] text-red-400 hover:text-red-600"
                          >
                            Revoke
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InviteModal workspaceId={workspaceId} open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  );
}

/* ─── Settings Tab ─── */

function SettingsTab({
  workspace,
  isOwner,
  isPending,
  startTransition,
  router,
}: {
  workspace: Props['workspace'];
  isOwner: boolean;
  isPending: boolean;
  startTransition: (cb: () => Promise<void>) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [name, setName] = useState(workspace.name);
  const [industry, setIndustry] = useState(
    INDUSTRY_OPTIONS.includes(workspace.industry ?? '')
      ? (workspace.industry ?? '')
      : workspace.industry
        ? 'Other'
        : '',
  );
  const [customIndustry, setCustomIndustry] = useState(
    !INDUSTRY_OPTIONS.includes(workspace.industry ?? '') && workspace.industry
      ? workspace.industry
      : '',
  );
  const [teamSize, setTeamSize] = useState(workspace.team_size ?? '');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const isOtherIndustry = industry === 'Other';

  function handleSave() {
    const finalIndustry = isOtherIndustry ? customIndustry.trim() : industry;
    startTransition(async () => {
      const result = await updateWorkspaceSettings(workspace.id, {
        name,
        industry: finalIndustry,
        team_size: teamSize,
      });
      if (result.error) toast.error(result.error);
      else toast.success('Workspace updated');
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#eee] bg-white">
        <div className="flex items-center gap-2.5 border-b border-[#f0f0f0] px-6 py-4">
          <Building2 size={15} className="text-[#999]" />
          <h2 className="text-[14px] font-semibold text-[#1a1a1a]">General</h2>
        </div>
        <div className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
              Workspace name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] focus:border-accent focus:outline-none focus:ring-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
                Industry
              </label>
              <select
                value={isOtherIndustry ? 'Other' : industry}
                onChange={(e) => {
                  setIndustry(e.target.value);
                  if (e.target.value !== 'Other') setCustomIndustry('');
                }}
                className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] focus:border-accent focus:outline-none focus:ring-1"
              >
                <option value="">Select industry...</option>
                {INDUSTRY_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              {isOtherIndustry && (
                <input
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  placeholder="Enter your industry..."
                  className="focus:ring-accent/30 mt-2 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
                />
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
                Team size
              </label>
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] focus:border-accent focus:outline-none focus:ring-1"
              >
                <option value="">Select team size...</option>
                {TEAM_SIZE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o} people
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[#bbb]">Slug: {workspace.slug}</p>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="h-9 rounded-lg bg-[#1a1a1a] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isPending ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200 bg-white">
        <div className="flex items-center gap-2.5 border-b border-red-100 px-6 py-4">
          <AlertTriangle size={15} className="text-red-400" />
          <h2 className="text-[14px] font-semibold text-red-600">Danger Zone</h2>
        </div>
        <div className="divide-y divide-red-50 px-6">
          {!isOwner && (
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-[13px] font-medium text-[#1a1a1a]">Leave workspace</p>
                <p className="mt-0.5 text-[12px] text-[#888]">You will lose access to all PRDs</p>
              </div>
              <button
                onClick={() =>
                  startTransition(async () => {
                    const r = await leaveWorkspace(workspace.id);
                    if (r.error) toast.error(r.error);
                    else {
                      toast.success('Left workspace');
                      router.push('/dashboard');
                    }
                  })
                }
                disabled={isPending}
                className="h-8 rounded-lg border border-red-200 px-3 text-[12px] font-medium text-red-500 hover:bg-red-50 disabled:opacity-40"
              >
                Leave
              </button>
            </div>
          )}
          {isOwner && (
            <div className="py-4">
              <p className="text-[13px] font-medium text-[#1a1a1a]">Delete workspace</p>
              <p className="mt-0.5 text-[12px] text-[#888]">
                Permanently delete this workspace and all its PRDs
              </p>
              <div className="mt-3 flex items-center gap-3">
                <input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={`Type "${workspace.name}" to confirm`}
                  className="focus:ring-red/30 h-8 flex-1 rounded-lg border border-red-200 px-3 text-[12px] text-[#1a1a1a] placeholder:text-[#ccc] focus:border-red-400 focus:outline-none focus:ring-1"
                />
                <button
                  onClick={() =>
                    startTransition(async () => {
                      const r = await deleteWorkspace(workspace.id);
                      if (r.error) toast.error(r.error);
                      else {
                        toast.success('Workspace deleted');
                        router.push('/dashboard');
                      }
                    })
                  }
                  disabled={isPending || deleteConfirm !== workspace.name}
                  className="h-8 rounded-lg bg-red-500 px-3 text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-40"
                >
                  Delete permanently
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Activity Tab ─── */

function ActivityTab({ workspaceId }: { workspaceId: string }) {
  const [activities, setActivities] = useState<
    { id: string; type: string; actor_id: string | null; created_at: string }[]
  >([]);
  const [actorMap, setActorMap] = useState<
    Record<string, { full_name: string | null; avatar_url: string | null }>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await getWorkspaceActivity(workspaceId);
        setActivities(result.activities);
        setActorMap(result.actorMap);
      } catch {
        /* ignore */
      }
      setLoading(false);
    }
    load();
  }, [workspaceId]);

  if (loading) return <p className="text-[13px] text-[#aaa]">Loading activity...</p>;

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
