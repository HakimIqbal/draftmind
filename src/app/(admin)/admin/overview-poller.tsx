'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AdminOverviewPoller() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      router.refresh();
    }, 15_000);

    return () => clearInterval(id);
  }, [router]);

  return null;
}
