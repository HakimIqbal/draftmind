'use client';

import { useState } from 'react';
import { Sliders } from 'lucide-react';
import { TweaksPanel } from './tweaks-panel';

export function TweaksButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-md border border-strong bg-bg-elevated text-ink-secondary transition-colors hover:text-ink-primary"
        aria-label="Open tweaks panel"
      >
        <Sliders size={16} />
      </button>
      <TweaksPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
