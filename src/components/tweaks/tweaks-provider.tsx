'use client';

import { useEffect } from 'react';
import { useTweaksStore } from '@/stores/tweaks-store';

export function TweaksProvider({ children }: { children: React.ReactNode }) {
  const theme = useTweaksStore((s) => s.theme);
  const font = useTweaksStore((s) => s.font);
  const density = useTweaksStore((s) => s.density);
  const accent = useTweaksStore((s) => s.accent);
  const radius = useTweaksStore((s) => s.radius);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.font = font;
    root.dataset.density = density;
    root.dataset.accent = accent;
    root.dataset.radius = radius;
  }, [theme, font, density, accent, radius]);

  return <>{children}</>;
}
