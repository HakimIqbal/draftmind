'use client';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function usePRD(prdId: string) {
  const router = useRouter();
  const supabase = createClient();

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const updateStatus = useCallback(
    async (status: string) => {
      await supabase.from('prds').update({ status }).eq('id', prdId);
      refresh();
    },
    [supabase, prdId, refresh],
  );

  const togglePin = useCallback(
    async (isPinned: boolean) => {
      await supabase.from('prds').update({ is_pinned: isPinned }).eq('id', prdId);
      refresh();
    },
    [supabase, prdId, refresh],
  );

  return { updateStatus, togglePin, refresh };
}
