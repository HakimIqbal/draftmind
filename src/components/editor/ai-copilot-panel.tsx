'use client';

import { ChevronRight } from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';
import { Sparkle } from '@/components/icons/sparkle';
import { Separator } from '@/components/ui/separator';

const SUGGESTED_PROMPTS = [
  '/improve writing',
  '/summarize',
  '/generate metrics',
  '/find gaps',
] as const;

export function AICopilotPanel() {
  const { toggleCopilot } = useEditorStore();

  return (
    <div className="flex h-full w-[360px] shrink-0 flex-col border-l border-subtle bg-bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkle size={14} />
          <span className="font-mono text-xs font-medium text-ink-primary">AI Copilot</span>
        </div>
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-bg-elevated hover:text-ink-primary"
          onClick={toggleCopilot}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Provider mode */}
      <div className="px-4 pb-3">
        <span className="font-mono text-[11px] text-ink-tertiary">[Provider mode]</span>
      </div>

      <Separator />

      {/* Body */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <p className="text-center text-sm text-ink-tertiary">Ask anything about this PRD</p>

        {/* Suggested prompts */}
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled
              className="rounded-sm border border-subtle px-2.5 py-1 font-mono text-[11px] text-ink-secondary opacity-70"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Bottom input */}
      <div className="p-4">
        <div className="flex h-9 items-center rounded-md border border-subtle bg-bg-canvas px-3">
          <span className="text-xs text-ink-quaternary">Ask or command... (&#8984;J)</span>
        </div>
      </div>
    </div>
  );
}
