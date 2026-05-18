'use client';

import { useState, useTransition } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { forceChangePassword } from '@/lib/actions/profile';

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
      setError(
        'Password must be at least 8 characters, include one uppercase letter and one number.',
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    startTransition(async () => {
      const result = await forceChangePassword(newPassword);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf9] px-4">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="bg-accent/10 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
            <KeyRound className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-[22px] font-bold text-[#1a1a1a]">Set a new password</h1>
          <p className="mt-2 text-[13px] text-[#888]">
            Your password was reset by an administrator. Please set a new password to continue.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#eee] bg-white p-8 shadow-sm"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
                New password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  required
                  minLength={8}
                  className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 pr-10 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666]"
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  required
                  className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 pr-10 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666]"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="text-[12px] text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={isPending || !newPassword || !confirmPassword}
              className="mt-2 h-10 w-full rounded-lg bg-[#1a1a1a] text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isPending ? 'Saving...' : 'Set new password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
