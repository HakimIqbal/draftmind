'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription';
import { MoreHorizontal, Search, UserPlus, Mail } from 'lucide-react';
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
import type { WorkspaceMemberItem, WorkspaceInvitationItem } from '@/app/(app)/workspace/page';

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
  workspaceId: string;
  currentUserId: string;
  currentUserRole: string;
  members: WorkspaceMemberItem[];
  invitations: WorkspaceInvitationItem[];
  disabledUserIds?: string[];
}

export function WorkspaceMembersTab({
  workspaceId,
  currentUserId,
  currentUserRole,
  members,
  invitations,
  disabledUserIds = [],
}: Props) {
  useRefreshOnFocus();
  useRealtimeSubscription({
    channel: `members-${workspaceId}`,
    table: 'workspace_members',
    filter: `workspace_id=eq.${workspaceId}`,
  });
  useRealtimeSubscription({
    channel: `invitations-${workspaceId}`,
    table: 'workspace_invitations',
    filter: `workspace_id=eq.${workspaceId}`,
  });
  const disabledSet = new Set(disabledUserIds);
  const isAdmin = currentUserRole === 'admin';
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
        <span className="text-[12px] text-[#bbb]">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </span>
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
              const isDisabled = disabledSet.has(member.user_id);
              const online = !isDisabled && mounted && isOnline(member.last_active_at);
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
                          {isDisabled && (
                            <span className="ml-1.5 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-500">
                              Disabled
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[11px] text-[#aaa]">{email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="text-[12px] text-[#666]">{role ?? '-'}</span>
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
                      <span className="text-[12px] text-[#999]" suppressHydrationWarning>
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
