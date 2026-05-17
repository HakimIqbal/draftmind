'use client';

import { useState, useEffect, useTransition } from 'react';
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
import type {
  WorkspaceMemberItem as WorkspaceMember,
  WorkspaceInvitationItem as WorkspaceInvitation,
} from '@/app/(app)/workspace/page';

function relativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return `${Math.floor(diffDay / 30)}mo ago`;
}

function isOnline(dateString: string | null): boolean {
  if (!dateString) return false;
  return Date.now() - new Date(dateString).getTime() < 5 * 60_000;
}

interface MembersTableProps {
  workspaceId: string;
  currentUserId: string;
  currentUserRole: string;
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];
}

export function MembersTable({
  workspaceId,
  currentUserId,
  currentUserRole,
  members,
  invitations,
}: MembersTableProps) {
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const isAdmin = currentUserRole === 'admin';

  // Defer online status to client to avoid hydration mismatch (Date.now() differs server/client)
  useEffect(() => setMounted(true), []);

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (m.profile?.full_name?.toLowerCase().includes(q) ?? false) ||
      (m.profile?.email?.toLowerCase().includes(q) ?? false)
    );
  });

  function handleRoleChange(userId: string, newRole: string) {
    startTransition(async () => {
      await changeRole(workspaceId, userId, newRole as 'admin' | 'editor' | 'commenter' | 'viewer');
    });
  }
  function handleRemove(userId: string) {
    startTransition(async () => {
      await removeMember(workspaceId, userId);
    });
  }
  function handleResend(id: string) {
    startTransition(async () => {
      await resendInvitation(workspaceId, id);
    });
  }
  function handleRevoke(id: string) {
    startTransition(async () => {
      await revokeInvitation(workspaceId, id);
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a1a1a]">Team</h1>
          <p className="mt-0.5 text-[13px] text-[#888]">
            {members.length} member{members.length !== 1 ? 's' : ''}
            {invitations.length > 0 && ` · ${invitations.length} pending`}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite
            </button>
          )}
        </div>
      </div>

      {/* Members table */}
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
                  {/* Member */}
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

                  {/* Role (profesi) */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <span className="text-[12px] text-[#666]">{role ?? '-'}</span>
                  </td>

                  {/* Access (permission) */}
                  <td className="whitespace-nowrap px-4 py-3.5">
                    {isAdmin && !isSelf ? (
                      <Select
                        value={member.role}
                        onValueChange={(val) => handleRoleChange(member.user_id, val)}
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

                  {/* Last active */}
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

                  {/* Actions */}
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
                            onClick={() => handleRemove(member.user_id)}
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

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="mt-8">
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
                            onClick={() => handleResend(inv.id)}
                            disabled={isPending}
                            className="text-[12px] text-[#999] hover:text-[#555]"
                          >
                            Resend
                          </button>
                          <button
                            onClick={() => handleRevoke(inv.id)}
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
    </div>
  );
}
