'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Refresh the page data when the browser tab regains focus.
 * Debounced to 1 second to prevent spam on rapid Alt+Tab.
 */
export function useRefreshOnFocus() {
  const router = useRouter();
  const lastRefresh = useRef(0);

  useEffect(() => {
    function handleFocus() {
      const now = Date.now();
      // Throttle: only refresh if >1 second since last refresh
      if (now - lastRefresh.current < 1000) return;
      lastRefresh.current = now;
      router.refresh();
    }

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [router]);
}
