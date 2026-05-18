'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function TemplatesPoller() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      router.refresh();
    }, 60_000);

    return () => clearInterval(id);
  }, [router]);

  return null;
}
