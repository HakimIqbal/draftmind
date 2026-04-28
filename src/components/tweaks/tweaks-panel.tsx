'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useTweaksStore } from '@/stores/tweaks-store';
import type {
  TweaksTheme,
  TweaksFont,
  TweaksDensity,
  TweaksAccent,
  TweaksRadius,
  TweaksCopilotPosition,
  TweaksPanelState,
} from '@/stores/tweaks-store';

interface TweaksPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TweakSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-md py-xs">
      <label className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-sm border border-strong bg-bg-surface px-2 py-1 font-mono text-[12px] text-ink-primary outline-none focus:border-accent"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TweaksPanel({ open, onOpenChange }: TweaksPanelProps) {
  const store = useTweaksStore();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed bottom-4 right-16 z-50 w-[320px] rounded-lg border border-strong bg-bg-elevated p-lg shadow-lg">
          <div className="mb-md flex items-center justify-between">
            <Dialog.Title className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
              Tweaks
            </Dialog.Title>
            <Dialog.Close className="text-ink-tertiary hover:text-ink-primary">
              <X size={14} />
            </Dialog.Close>
          </div>

          <div className="space-y-xs">
            <TweakSelect<TweaksTheme>
              label="Theme"
              value={store.theme}
              onChange={(v) => store.setTweak('theme', v)}
              options={[
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
              ]}
            />

            <TweakSelect<TweaksFont>
              label="Font"
              value={store.font}
              onChange={(v) => store.setTweak('font', v)}
              options={[
                { value: 'fraunces-inter', label: 'Fraunces + Inter' },
                { value: 'playfair-inter', label: 'Playfair + Inter' },
                { value: 'sans-inter', label: 'Inter Tight' },
                { value: 'sans-geist', label: 'Geist' },
                { value: 'sans-ibmplex', label: 'IBM Plex' },
                { value: 'dmserif-dmsans', label: 'DM Serif + DM Sans' },
              ]}
            />

            <TweakSelect<TweaksDensity>
              label="Density"
              value={store.density}
              onChange={(v) => store.setTweak('density', v)}
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'cozy', label: 'Cozy' },
              ]}
            />

            <TweakSelect<TweaksAccent>
              label="Accent"
              value={store.accent}
              onChange={(v) => store.setTweak('accent', v)}
              options={[
                { value: 'ember', label: 'Ember' },
                { value: 'forest', label: 'Forest' },
                { value: 'deep-blue', label: 'Deep Blue' },
                { value: 'plum', label: 'Plum' },
                { value: 'charcoal', label: 'Charcoal' },
              ]}
            />

            <TweakSelect<TweaksRadius>
              label="Radius"
              value={store.radius}
              onChange={(v) => store.setTweak('radius', v)}
              options={[
                { value: 'sharp', label: 'Sharp' },
                { value: 'default', label: 'Default' },
                { value: 'rounded', label: 'Rounded' },
              ]}
            />

            <TweakSelect<TweaksCopilotPosition>
              label="Copilot Position"
              value={store.copilotPosition}
              onChange={(v) => store.setTweak('copilotPosition', v)}
              options={[
                { value: 'right', label: 'Right' },
                { value: 'left', label: 'Left' },
                { value: 'bottom', label: 'Bottom' },
              ]}
            />

            <TweakSelect<TweaksPanelState>
              label="Panel State"
              value={store.panelState}
              onChange={(v) => store.setTweak('panelState', v)}
              options={[
                { value: 'expanded', label: 'Expanded' },
                { value: 'collapsed', label: 'Collapsed' },
              ]}
            />
          </div>

          <div className="mt-lg flex flex-col gap-sm">
            <button
              onClick={store.reset}
              className="rounded-sm border border-strong px-3 py-1.5 font-mono text-[12px] text-ink-secondary transition-colors hover:text-ink-primary"
            >
              Reset to defaults
            </button>
            <p className="font-mono text-[11px] text-ink-tertiary">
              Tweaks apply globally &middot; stored in localStorage
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
