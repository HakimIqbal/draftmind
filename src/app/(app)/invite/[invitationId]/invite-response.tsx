'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { acceptInvitation, rejectInvitation } from '@/app/(app)/workspace/members/actions';

export function InviteResponse({
  invitationId,
  workspaceName,
}: {
  invitationId: string;
  workspaceName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState('');

  async function handleAccept() {
    setLoading('accept');
    const result = await acceptInvitation(invitationId);
    if (result.error) {
      toast.error(result.error);
      setLoading('');
    } else {
      toast.success(`Joined ${workspaceName}!`);
      router.push('/dashboard');
    }
  }

  async function handleReject() {
    setLoading('reject');
    const result = await rejectInvitation(invitationId);
    if (result.error) {
      toast.error(result.error);
      setLoading('');
    } else {
      toast.success('Invitation declined');
      router.push('/dashboard');
    }
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <button
        onClick={handleReject}
        disabled={!!loading}
        className="rounded-lg border border-[#eee] px-6 py-2.5 text-[13px] font-medium text-[#555] transition-colors hover:bg-[#fafaf9] disabled:opacity-50"
      >
        {loading === 'reject' ? 'Declining...' : 'Decline'}
      </button>
      <button
        onClick={handleAccept}
        disabled={!!loading}
        className="rounded-lg bg-[#1a1a1a] px-6 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#333] disabled:opacity-50"
      >
        {loading === 'accept' ? 'Joining...' : 'Accept & Join'}
      </button>
    </div>
  );
}
