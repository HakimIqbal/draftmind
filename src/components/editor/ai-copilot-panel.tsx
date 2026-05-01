'use client';

import { useState } from 'react';
import { ChevronRight, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useEditorStore } from '@/stores/editor-store';
import { Sparkle } from '@/components/icons/sparkle';
import { Separator } from '@/components/ui/separator';

const SUGGESTED_PROMPTS = [
  {
    label: '/improve writing',
    instruction:
      'Improve the writing quality, clarity, and readability of this PRD. Fix any awkward phrasing.',
  },
  {
    label: '/summarize',
    instruction: 'Summarize the key points of this PRD in 3-5 concise bullet points.',
  },
  {
    label: '/generate metrics',
    instruction:
      'Suggest additional success metrics with baselines and targets based on the objectives.',
  },
  {
    label: '/find gaps',
    instruction:
      'Identify missing information, weak areas, and sections that need more detail in this PRD.',
  },
] as const;

interface AICopilotPanelProps {
  prdId?: string;
}

export function AICopilotPanel({ prdId }: AICopilotPanelProps) {
  const { toggleCopilot } = useEditorStore();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  async function handleSubmit(instruction: string) {
    if (!prdId || !instruction.trim()) return;
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/prd/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prdId,
          action: 'rewrite',
          selectedText: instruction,
        }),
      });

      if (!res.ok) {
        toast.error('Failed to get AI response. Please try again.');
        return;
      }

      const data = await res.json();
      const suggestions = data.suggestions ?? [];
      if (suggestions.length > 0) {
        setResponse(suggestions[0].text);
      } else {
        setResponse('No suggestions available.');
      }
    } catch {
      toast.error('Failed to connect to AI. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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

      <Separator />

      {/* Body */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {response ? (
          <div className="flex-1 px-4 py-4">
            <p className="mb-2 font-mono text-[10px] uppercase text-ink-tertiary">AI Response</p>
            <div className="rounded-lg border border-subtle bg-bg-canvas p-3 text-sm leading-relaxed text-ink-primary">
              {response}
            </div>
            <button
              type="button"
              onClick={() => setResponse(null)}
              className="mt-3 text-xs text-ink-tertiary hover:text-ink-primary"
            >
              Clear
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 size={20} className="animate-spin text-ink-tertiary" />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
            <p className="text-center text-sm text-ink-tertiary">Ask anything about this PRD</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => handleSubmit(prompt.instruction)}
                  className="rounded-md border border-subtle px-2.5 py-1.5 font-mono text-[11px] text-ink-secondary transition-colors hover:border-strong hover:text-ink-primary"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Bottom input */}
      <div className="p-4">
        <div className="flex items-center gap-2 rounded-md border border-subtle bg-bg-canvas px-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                handleSubmit(query.trim());
                setQuery('');
              }
            }}
            placeholder="Ask or command... (⌘J)"
            className="h-9 flex-1 bg-transparent text-xs text-ink-primary placeholder:text-ink-quaternary focus:outline-none"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => {
              if (query.trim()) {
                handleSubmit(query.trim());
                setQuery('');
              }
            }}
            disabled={!query.trim() || loading}
            className="text-ink-tertiary transition-colors hover:text-ink-primary disabled:opacity-30"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
