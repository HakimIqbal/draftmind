'use client';

import { useState, useTransition } from 'react';
import { MoreHorizontal, Search, UserPlus } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
import type { WorkspaceMember, WorkspaceInvitation } from '@/app/(app)/workspace/members/page';

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
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo ago`;
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
  const isAdmin = currentUserRole === 'admin';

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const name = m.profile?.full_name?.toLowerCase() ?? '';
    const email = m.profile?.email?.toLowerCase() ?? '';
    return name.includes(q) || email.includes(q);
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

  function handleResend(invitationId: string) {
    startTransition(async () => {
      await resendInvitation(workspaceId, invitationId);
    });
  }

  function handleRevoke(invitationId: string) {
    startTransition(async () => {
      await revokeInvitation(workspaceId, invitationId);
    });
  }

  return (
    <div className="space-y-6 p-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-ink-primary">
          Members{' '}
          <span className="font-mono text-sm font-normal text-ink-tertiary">{members.length}</span>
        </h1>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Invite member
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-tertiary" />
        <Input
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Members table */}
      <div className="overflow-hidden rounded-md border border-subtle">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-subtle bg-bg-surface">
              <th className="px-4 py-2 text-left font-mono text-[11px] uppercase text-ink-tertiary">
                Member
              </th>
              <th className="px-4 py-2 text-left font-mono text-[11px] uppercase text-ink-tertiary">
                Role
              </th>
              <th className="hidden px-4 py-2 text-left font-mono text-[11px] uppercase text-ink-tertiary sm:table-cell">
                Last active
              </th>
              <th className="w-10 px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((member) => {
              const name = member.profile?.full_name ?? 'Unknown';
              const email = member.profile?.email ?? '';
              const isSelf = member.user_id === currentUserId;

              return (
                <tr
                  key={member.user_id}
                  className="hover:bg-bg-surface/50 border-b border-subtle transition-colors last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={name}
                        size="md"
                        seed={member.profile?.avatar_color_seed ?? undefined}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-ink-primary">
                          {name}
                          {isSelf && (
                            <span className="ml-1.5 font-mono text-[10px] text-ink-tertiary">
                              you
                            </span>
                          )}
                        </div>
                        <div className="truncate font-mono text-xs text-ink-secondary">{email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && !isSelf ? (
                      <Select
                        value={member.role}
                        onValueChange={(val) => handleRoleChange(member.user_id, val)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-7 w-[120px] text-xs">
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
                      <span className="text-sm capitalize text-ink-primary">{member.role}</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="font-mono text-xs text-ink-tertiary">
                      {relativeTime(member.last_active_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && !isSelf && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="rounded p-1 text-ink-tertiary transition-colors hover:text-ink-primary">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-muted"
                            onClick={() => handleRemove(member.user_id)}
                          >
                            Remove member
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
                <td colSpan={4} className="py-8 text-center text-sm text-ink-secondary">
                  No members found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="font-display text-sm font-semibold text-ink-primary">
              Pending invitations
            </h2>
            <div className="overflow-hidden rounded-md border border-subtle">
              <table className="w-full text-sm">
                <tbody>
                  {invitations.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-bg-surface/50 border-b border-subtle transition-colors last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-ink-primary">{inv.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm capitalize text-ink-primary">{inv.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-sm border border-amber-500/30 px-2 py-0.5 font-mono text-[11px] text-amber-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          Pending
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isAdmin && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResend(inv.id)}
                              disabled={isPending}
                            >
                              Resend
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-muted"
                              onClick={() => handleRevoke(inv.id)}
                              disabled={isPending}
                            >
                              Revoke
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Invite modal */}
      <InviteModal workspaceId={workspaceId} open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
