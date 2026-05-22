'use client';

import { useEffect } from 'react';

export function PresenceHeartbeat() {
  useEffect(() => {
    let stopped = false;

    async function touch() {
      if (stopped || document.visibilityState !== 'visible') return;
      try {
        await fetch('/api/presence/touch', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        });
      } catch {}
    }

    void touch();
    const interval = setInterval(() => {
      void touch();
    }, 60_000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') void touch();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopped = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
