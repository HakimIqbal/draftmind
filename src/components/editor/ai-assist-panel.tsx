'use client';

import { useState } from 'react';
import {
  RefreshCw,
  Maximize2,
  AlignLeft,
  Minimize2,
  GraduationCap,
  CheckCheck,
  X,
  Loader2,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sparkle } from '@/components/icons/sparkle';

interface AIAssistPanelProps {
  selectedText: string;
  prdId: string;
  onInsert: (text: string) => void;
  onClose: () => void;
}

interface Suggestion {
  text: string;
  rationale: string;
}

const QUICK_ACTIONS = [
  { action: 'rewrite', label: 'Rewrite', icon: RefreshCw },
  { action: 'expand', label: 'Expand', icon: Maximize2 },
  { action: 'summarize', label: 'Summarize', icon: AlignLeft },
  { action: 'shorter', label: 'Shorter', icon: Minimize2 },
  { action: 'formal', label: 'More formal', icon: GraduationCap },
  { action: 'grammar', label: 'Fix grammar', icon: CheckCheck },
] as const;

export function AIAssistPanel({ selectedText, prdId, onInsert, onClose }: AIAssistPanelProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const truncated = selectedText.length > 50 ? selectedText.slice(0, 50) + '...' : selectedText;

  async function handleAction(action: string) {
    setLoading(true);
    setActiveAction(action);
    setSuggestions([]);

    try {
      const res = await fetch('/api/prd/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdId, action, selectedText }),
      });

      if (!res.ok) throw new Error('Request failed');

      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch {
      toast.error('Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  return (
    <div className="flex h-full w-[360px] shrink-0 flex-col border-l border-subtle bg-bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkle size={14} />
          <span className="text-sm font-medium text-ink-primary">AI Assist</span>
        </div>
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-bg-elevated hover:text-ink-primary"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      {/* Selected text meta */}
      <div className="px-4 pb-3">
        <span className="font-mono text-[11px] text-ink-tertiary">&quot;{truncated}&quot;</span>
      </div>

      <Separator />

      {/* Quick actions */}
      <div className="px-4 pb-2 pt-4">
        <span className="font-mono text-[11px] uppercase text-ink-tertiary">Quick Actions</span>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        {QUICK_ACTIONS.map(({ action, label, icon: Icon }) => (
          <Button
            key={action}
            variant="outline"
            size="sm"
            disabled={loading}
            className="justify-start gap-2"
            onClick={() => handleAction(action)}
          >
            <Icon size={14} />
            <span className="text-sm">{label}</span>
          </Button>
        ))}
      </div>

      <Separator />

      {/* Suggestions */}
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-ink-tertiary" />
          </div>
        )}

        {!loading && suggestions.length > 0 && (
          <>
            <span className="font-mono text-[11px] uppercase text-ink-tertiary">Suggestions</span>
            <div className="mt-3 flex flex-col gap-3">
              {suggestions.map((s, i) => (
                <Card key={i} className="border-subtle bg-bg-surface p-3">
                  <p className="text-sm leading-relaxed text-ink-primary">{s.text}</p>
                  <p className="mt-1 font-mono text-[11px] text-ink-tertiary">{s.rationale}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onInsert(s.text)}>
                      Insert
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleCopy(s.text)}
                    >
                      <Copy size={12} />
                      Copy
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {!loading && suggestions.length === 0 && activeAction === null && (
          <p className="py-8 text-center text-sm text-ink-tertiary">
            Select an action above to get AI suggestions
          </p>
        )}
      </div>

      <Separator />

      {/* Footer meta */}
      <div className="px-4 py-3">
        <span className="font-mono text-[11px] text-ink-tertiary">[mock] &middot; 0 credits</span>
      </div>
    </div>
  );
}
