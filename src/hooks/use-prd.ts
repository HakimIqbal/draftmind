'use client';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { updatePRDStatus, togglePRDPin } from '@/app/(app)/prds/[prdId]/actions';

export function usePRD(prdId: string) {
  const router = useRouter();

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const updateStatus = useCallback(
    async (status: string) => {
      await updatePRDStatus(prdId, status);
      refresh();
    },
    [prdId, refresh],
  );

  const togglePin = useCallback(
    async (isPinned: boolean) => {
      await togglePRDPin(prdId, isPinned);
      refresh();
    },
    [prdId, refresh],
  );

  return { updateStatus, togglePin, refresh };
}
