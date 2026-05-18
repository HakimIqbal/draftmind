'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Shield, ShieldOff, UserX, UserPlus, X, Eye, EyeOff, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';
import {
  toggleSuperAdmin,
  toggleUserStatus,
  createUser,
  resetUserPassword,
} from '@/app/(admin)/admin/actions';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role_self_reported: string | null;
  is_super_admin: boolean;
  onboarding_completed_at: string | null;
  is_disabled: boolean;
  created_at: string;
  avatar_url: string | null;
}

export function AdminUsersTable({ users, totalCount }: { users: AdminUser[]; totalCount: number }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [localUsers, setLocalUsers] = useState<AdminUser[]>(users);
  const router = useRouter();

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [router]);

  const filtered = localUsers.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.full_name?.toLowerCase().includes(q) ?? false) || u.email.toLowerCase().includes(q);
  });

  function handleToggleAdmin(userId: string) {
    startTransition(async () => {
      const result = await toggleSuperAdmin(userId);
      if (result.error) toast.error(result.error);
      else {
        toast.success('Admin status updated');
        router.refresh();
      }
    });
  }

  function handleToggleStatus(userId: string) {
    const prev = localUsers;
    setLocalUsers(
      localUsers.map((u) => (u.id === userId ? { ...u, is_disabled: !u.is_disabled } : u)),
    );
    startTransition(async () => {
      const result = await toggleUserStatus(userId);
      if (result.error) {
        toast.error(result.error);
        setLocalUsers(prev);
      } else {
        toast.success(result.disabled ? 'User disabled' : 'User enabled');
      }
    });
  }

  function handleResetPassword(userId: string) {
    startTransition(async () => {
      const result = await resetUserPassword(userId);
      if (result?.error) toast.error(result.error);
      else toast.success('Password reset to default. User will be forced to change on next login.');
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a1a1a]">Users</h1>
          <p className="mt-0.5 text-[13px] text-[#888]">{totalCount} registered users</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-60">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]"
            />
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="focus:ring-accent/30 h-9 w-full rounded-lg border border-[#e5e5e3] bg-white pl-9 pr-3 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            <UserPlus size={14} />
            Add user
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#eee]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f0f0f0] bg-[#fafaf9]">
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                User
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Role
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Type
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Status
              </th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Joined
              </th>
              <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[#999]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="border-b border-[#f5f5f5] transition-colors hover:bg-[#fafaf9]"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.full_name ?? 'User'} size="sm" avatarUrl={u.avatar_url} />
                    <div>
                      <p className="text-[13px] font-medium text-[#1a1a1a]">
                        {u.full_name ?? 'No name'}
                      </p>
                      <p className="text-[11px] text-[#aaa]">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[12px] text-[#666]">
                    {u.is_super_admin ? 'System Administrator' : (u.role_self_reported ?? '-')}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${u.is_super_admin ? 'bg-accent/10 text-accent' : 'bg-[#f5f5f4] text-[#888]'}`}
                  >
                    {u.is_super_admin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${u.is_disabled ? 'bg-red-400' : u.onboarding_completed_at ? 'bg-emerald-400' : 'bg-amber-400'}`}
                    />
                    <span
                      className={`text-[12px] ${u.is_disabled ? 'text-red-500' : 'text-[#666]'}`}
                    >
                      {u.is_disabled
                        ? 'Disabled'
                        : u.onboarding_completed_at
                          ? 'Active'
                          : 'Pending'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[12px] text-[#999]" suppressHydrationWarning>
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleToggleAdmin(u.id)}
                      disabled={isPending}
                      className="rounded-md p-1.5 text-[#bbb] transition-colors hover:bg-[#f5f5f4] hover:text-[#666] disabled:opacity-40"
                      title={u.is_super_admin ? 'Remove admin' : 'Make admin'}
                    >
                      {u.is_super_admin ? <ShieldOff size={14} /> : <Shield size={14} />}
                    </button>
                    <button
                      onClick={() => handleResetPassword(u.id)}
                      disabled={isPending}
                      className="rounded-md p-1.5 text-[#bbb] transition-colors hover:bg-amber-50 hover:text-amber-600 disabled:opacity-40"
                      title="Reset password to default"
                    >
                      <KeyRound size={14} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(u.id)}
                      disabled={isPending}
                      className={`rounded-md p-1.5 transition-colors disabled:opacity-40 ${u.is_disabled ? 'text-red-400 hover:bg-emerald-50 hover:text-emerald-600' : 'text-[#bbb] hover:bg-red-50 hover:text-red-500'}`}
                      title={u.is_disabled ? 'Enable user' : 'Disable user'}
                    >
                      <UserX size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-[13px] text-[#aaa]">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <CreateUserModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            router.refresh();
          }}
          isPending={isPending}
          startTransition={startTransition}
        />
      )}
    </div>
  );
}

function CreateUserModal({
  onClose,
  onSuccess,
  isPending,
  startTransition,
}: {
  onClose: () => void;
  onSuccess: () => void;
  isPending: boolean;
  startTransition: (callback: () => Promise<void>) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Product Manager');
  const [customRole, setCustomRole] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isOther = role === 'Other';
  const finalRole = isOther ? customRole : role;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !fullName) return;
    if (isOther && !customRole.trim()) return;

    startTransition(async () => {
      const result = await createUser({
        email,
        password,
        full_name: fullName,
        role_self_reported: finalRole,
        is_super_admin: isAdmin,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('User created successfully');
        onSuccess();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-[#eee] bg-white p-8 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-[#bbb] hover:text-[#666]">
          <X size={18} />
        </button>

        <h2 className="text-[18px] font-bold text-[#1a1a1a]">Add new user</h2>
        <p className="mt-1 text-[13px] text-[#888]">Create a new account for your team</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
              required
              className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 pr-10 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666]"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          {!isAdmin && (
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] focus:border-accent focus:outline-none focus:ring-1"
              >
                <option>Product Manager</option>
                <option>Product Owner</option>
                <option>Software Engineer</option>
                <option>Engineering Manager</option>
                <option>UX Designer</option>
                <option>Data Analyst</option>
                <option>Founder / CEO</option>
                <option>Other</option>
              </select>
              {isOther && (
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="Enter custom role..."
                  required
                  className="focus:ring-accent/30 mt-2 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
                />
              )}
            </div>
          )}
          <div>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="h-4 w-4 rounded border-[#ddd] accent-accent"
              />
              <span className="text-[13px] text-[#1a1a1a]">Set as admin system</span>
            </label>
            <p className="mt-1 pl-[26px] text-[11px] text-[#aaa]">
              Admin can manage all system settings and users
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#e5e5e3] bg-white py-2.5 text-[13px] font-medium text-[#666] transition-colors hover:bg-[#fafaf9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isPending || !email || !password || !fullName || (isOther && !customRole.trim())
              }
              className="flex-1 rounded-lg bg-[#1a1a1a] py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isPending ? 'Creating...' : 'Create user'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
