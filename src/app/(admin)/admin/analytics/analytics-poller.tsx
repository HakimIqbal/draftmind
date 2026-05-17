'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AnalyticsPoller() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      router.refresh();
    }, 60_000);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
