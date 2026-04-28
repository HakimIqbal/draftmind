'use client';

import { useEffect } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.theme = 'light';
    return () => {
      const stored = localStorage.getItem('draftmind-tweaks');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          document.documentElement.dataset.theme = parsed?.state?.theme ?? 'dark';
        } catch {
          document.documentElement.dataset.theme = 'dark';
        }
      } else {
        document.documentElement.dataset.theme = 'dark';
      }
    };
  }, []);

  return <>{children}</>;
}
