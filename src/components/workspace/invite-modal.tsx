'use client';

import { useState, useEffect, useTransition, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { inviteMember, getInvitableUsers } from '@/app/(app)/workspace/members/actions';

interface InvitableUser {
  id: string;
  full_name: string | null;
  email: string;
  role_self_reported: string | null;
  avatar_color_seed: string | null;
  avatar_url: string | null;
}

interface InviteModalProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteModal({ workspaceId, open, onOpenChange }: InviteModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<InvitableUser | null>(null);
  const [role, setRole] = useState<'admin' | 'editor' | 'commenter' | 'viewer'>('editor');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<InvitableUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load invitable users when modal opens
  const loadUsers = useCallback(async () => {
    try {
      const data = await getInvitableUsers(workspaceId);
      setUsers(data);
    } catch {
      // Ignore
    }
  }, [workspaceId]);

  useEffect(() => {
    if (open) {
      loadUsers();
      setEmail('');
      setSelectedUser(null);
      setError(null);
      setRole('editor');
    }
  }, [open, loadUsers]);

  // Click outside dropdown
  useEffect(() => {
    if (!showDropdown) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  const query = email.toLowerCase();
  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(query) ||
      (u.full_name?.toLowerCase().includes(query) ?? false),
  );

  function handleSelectUser(user: InvitableUser) {
    setSelectedUser(user);
    setEmail(user.email);
    setShowDropdown(false);
  }

  function handleClearSelection() {
    setSelectedUser(null);
    setEmail('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const finalEmail = selectedUser?.email ?? email.trim();
    if (!finalEmail) {
      setError('Please select a user');
      return;
    }

    startTransition(async () => {
      const result = await inviteMember(workspaceId, finalEmail, role);
      if (result.success) {
        toast.success('Invitation sent');
        setEmail('');
        setSelectedUser(null);
        setRole('editor');
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.error ?? 'Failed to send invitation');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="font-display">Invite member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User picker */}
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase text-ink-tertiary">Select user</label>

            {selectedUser ? (
              /* Selected user chip */
              <div className="flex items-center gap-3 rounded-lg border border-[#e5e5e3] bg-[#fafaf9] px-3 py-2.5">
                <Avatar
                  name={selectedUser.full_name ?? 'User'}
                  size="sm"
                  seed={selectedUser.avatar_color_seed ?? undefined}
                  avatarUrl={selectedUser.avatar_url}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#1a1a1a]">
                    {selectedUser.full_name ?? 'No name'}
                  </p>
                  <p className="truncate text-[11px] text-[#aaa]">{selectedUser.email}</p>
                </div>
                {selectedUser.role_self_reported && (
                  <span className="shrink-0 rounded bg-[#f0f0ee] px-1.5 py-0.5 text-[10px] text-[#888]">
                    {selectedUser.role_self_reported}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="shrink-0 text-[#bbb] hover:text-[#666]"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              /* Search input with dropdown */
              <div className="relative" ref={dropdownRef}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search by name or email..."
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  disabled={isPending}
                  className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
                />

                {showDropdown && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-[240px] overflow-y-auto rounded-xl border border-[#eee] bg-white shadow-lg">
                    {filtered.length > 0 ? (
                      filtered.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onMouseDown={() => handleSelectUser(u)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#fafaf9]"
                        >
                          <Avatar
                            name={u.full_name ?? 'User'}
                            size="sm"
                            seed={u.avatar_color_seed ?? undefined}
                            avatarUrl={u.avatar_url}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-[#1a1a1a]">
                              {u.full_name ?? 'No name'}
                            </p>
                            <p className="truncate text-[11px] text-[#aaa]">{u.email}</p>
                          </div>
                          {u.role_self_reported && (
                            <span className="shrink-0 rounded bg-[#f5f5f4] px-1.5 py-0.5 text-[10px] text-[#888]">
                              {u.role_self_reported}
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-[12px] text-[#aaa]">
                        {email ? 'No users found' : 'Type to search users'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase text-ink-tertiary">Permission</label>
            <Select
              value={role}
              onValueChange={(val) => setRole(val as typeof role)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="commenter">Commenter</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-xs text-red-muted">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={isPending || (!selectedUser && !email.trim())}
            >
              {isPending ? 'Sending...' : 'Send invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
