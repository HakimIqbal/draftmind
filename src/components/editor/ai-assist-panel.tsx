'use client';

import { useState } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import {
  RefreshCw,
  Maximize2,
  AlignLeft,
  Minimize2,
  GraduationCap,
  CheckCheck,
  X,
  Copy,
  Check,
  Languages,
  Lightbulb,
  Target,
  BarChart3,
  BookOpen,
  Table2,
  List,
  ChevronDown,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Sparkle } from '@/components/icons/sparkle';

interface AIAssistPanelProps {
  selectedText: string;
  prdId: string;
  onInsert: (text: string) => void;
  onClose: () => void;
  providers?: { id: string; display_name: string; default_model: string }[];
}

interface Suggestion {
  text: string;
  rationale: string;
}

const QUICK_ACTIONS = [
  { action: 'rewrite', label: 'Rewrite', icon: RefreshCw, desc: 'Clearer, same facts' },
  { action: 'expand', label: 'Expand', icon: Maximize2, desc: 'Add useful detail' },
  { action: 'summarize', label: 'Summarize', icon: AlignLeft, desc: 'Key points only' },
  { action: 'shorter', label: 'Shorter', icon: Minimize2, desc: 'Cut 40-60%' },
  { action: 'formal', label: 'More Formal', icon: GraduationCap, desc: 'Executive tone' },
  { action: 'grammar', label: 'Fix Grammar', icon: CheckCheck, desc: 'Errors only' },
] as const;

const MORE_ACTIONS = [
  {
    action: 'translate',
    label: 'Translate Auto-detect ID↔EN',
    icon: Languages,
    desc: 'Translate only',
  },
  { action: 'add_examples', label: 'Add Examples', icon: Lightbulb, desc: 'Concrete cases' },
  {
    action: 'make_actionable',
    label: 'Make Actionable',
    icon: Target,
    desc: 'Clear next steps',
  },
  { action: 'add_metrics', label: 'Add Metrics', icon: BarChart3, desc: 'KPIs & targets' },
  { action: 'simplify_jargon', label: 'Simplify jargon', icon: BookOpen, desc: 'Plain language' },
  { action: 'to_table', label: 'To Table', icon: Table2, desc: 'Structured table' },
  { action: 'to_list', label: 'To List', icon: List, desc: 'Flat bullets' },
] as const;

export function AIAssistPanel({
  selectedText,
  prdId,
  onInsert,
  onClose,
  providers,
}: AIAssistPanelProps) {
  const currentSection = useEditorStore((s) => s.currentSection);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState(providers?.[0]?.id ?? '');
  const [showMore, setShowMore] = useState(false);
  const [showOriginal, setShowOriginal] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);

  const selectedProvider = providers?.find((p) => p.id === selectedProviderId);
  const truncated = selectedText.length > 120 ? selectedText.slice(0, 120) + '...' : selectedText;

  async function handleAction(action: string) {
    setLoading(true);
    setActiveAction(action);
    setSuggestions([]);
    setShowOriginal(null);
    try {
      const res = await fetch('/api/prd/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prdId,
          action,
          selectedText,
          sectionKey: currentSection,
          providerId: selectedProviderId || undefined,
        }),
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

  function handleCopy(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success('Copied!');
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  const activeLabel = activeAction
    ? ([...QUICK_ACTIONS, ...MORE_ACTIONS].find((a) => a.action === activeAction)?.label ??
      'Custom')
    : null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex h-full w-full max-w-[340px] shrink-0 flex-col border-l border-subtle bg-bg-surface md:static md:z-auto md:w-[320px] md:max-w-none lg:w-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-subtle bg-bg-elevated px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-accent/10 flex h-7 w-7 items-center justify-center rounded-lg">
            <Sparkle size={13} className="text-accent" />
          </div>
          <span className="text-[13px] font-semibold text-ink-primary">AI Assist</span>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-tertiary transition-colors hover:bg-bg-surface hover:text-ink-primary"
        >
          <X size={16} />
        </button>
      </div>

      {/* Selected text preview */}
      <div className="border-b border-subtle bg-bg-elevated px-4 py-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-accent" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
            Selected text
          </p>
        </div>
        <div className="rounded-lg border border-subtle bg-bg-surface px-3 py-2.5">
          <p className="line-clamp-3 text-[12px] leading-relaxed text-ink-secondary">{truncated}</p>
        </div>
      </div>

      {/* Model selector */}
      {providers && providers.length > 1 && (
        <div className="relative border-b border-subtle bg-bg-elevated px-4 py-2">
          <button
            onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
            className="hover:border-default flex w-full items-center justify-between rounded-lg border border-subtle bg-bg-surface px-3 py-2 text-[12px] text-ink-secondary transition-colors hover:bg-bg-elevated"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={12} className="text-accent/60" />
              {selectedProvider?.display_name ?? 'Select model'}
            </span>
            <ChevronDown
              size={13}
              className={`text-ink-tertiary transition-transform ${providerDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {providerDropdownOpen && (
            <div className="absolute left-4 right-4 top-full z-20 mt-1 overflow-hidden rounded-xl border border-subtle bg-bg-elevated shadow-lg">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProviderId(p.id);
                    setProviderDropdownOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[12px] transition-colors hover:bg-bg-surface ${p.id === selectedProviderId ? 'bg-bg-surface font-medium text-ink-primary' : 'text-ink-secondary'}`}
                >
                  <span className="flex-1">{p.display_name}</span>
                  <span className="text-[10px] text-ink-quaternary">{p.default_model}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Quick actions */}
        <div className="px-4 pb-1.5 pt-4">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-sage-muted" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
              Quick Actions
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 px-4 pb-3">
          {QUICK_ACTIONS.map(({ action, label, icon: Icon, desc }) => (
            <button
              key={action}
              disabled={loading}
              onClick={() => handleAction(action)}
              className={`group flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                activeAction === action
                  ? 'border-accent/30 bg-accent/5 shadow-[0_0_0_1px_rgba(232,116,60,0.1)]'
                  : 'hover:border-accent/20 hover:bg-accent/5 border-subtle bg-bg-elevated hover:shadow-sm'
              } disabled:pointer-events-none disabled:opacity-40`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  activeAction === action
                    ? 'bg-accent/15 text-accent'
                    : 'group-hover:bg-accent/10 bg-bg-surface text-ink-tertiary group-hover:text-accent'
                }`}
              >
                <Icon size={14} />
              </div>
              <span
                className={`text-[12px] font-medium ${activeAction === action ? 'text-accent' : 'text-ink-primary'}`}
              >
                {label}
              </span>
              <span className="text-[10px] leading-tight text-ink-tertiary">{desc}</span>
            </button>
          ))}
        </div>

        {/* More actions */}
        <div className="px-4">
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary transition-colors hover:text-ink-secondary"
          >
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-muted" />
              More Actions
            </div>
            <ChevronDown
              size={13}
              className={`transition-transform ${showMore ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
        {showMore && (
          <div className="grid grid-cols-2 gap-2 px-4 pb-3 duration-200 animate-in fade-in slide-in-from-top-1">
            {MORE_ACTIONS.map(({ action, label, icon: Icon, desc }, index) => (
              <button
                key={action}
                disabled={loading}
                onClick={() => handleAction(action)}
                className={`group flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                  MORE_ACTIONS.length % 2 === 1 && index === MORE_ACTIONS.length - 1
                    ? 'col-span-2'
                    : ''
                } ${
                  activeAction === action
                    ? 'border-accent/30 bg-accent/5 shadow-[0_0_0_1px_rgba(232,116,60,0.1)]'
                    : 'hover:border-accent/20 hover:bg-accent/5 border-subtle bg-bg-elevated hover:shadow-sm'
                } disabled:pointer-events-none disabled:opacity-40`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                    activeAction === action
                      ? 'bg-accent/15 text-accent'
                      : 'group-hover:bg-accent/10 bg-bg-surface text-ink-tertiary group-hover:text-accent'
                  }`}
                >
                  <Icon size={14} />
                </div>
                <span
                  className={`text-[12px] font-medium ${activeAction === action ? 'text-accent' : 'text-ink-primary'}`}
                >
                  {label}
                </span>
                <span className="text-[10px] leading-tight text-ink-tertiary">{desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="border-t border-subtle px-4 pb-6 pt-3">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <div className="border-accent/20 absolute inset-0 animate-spin rounded-full border-2 border-t-accent" />
                <Sparkle size={16} className="text-accent" />
              </div>
              <div className="text-center">
                <p className="text-[12px] font-medium text-ink-secondary">
                  Generating suggestions...
                </p>
                <p className="mt-0.5 text-[11px] text-ink-quaternary">{activeLabel}</p>
              </div>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
                    {suggestions.length} Suggestion{suggestions.length > 1 ? 's' : ''}
                  </p>
                </div>
                {activeAction && (
                  <button
                    onClick={() => handleAction(activeAction)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-ink-quaternary transition-colors hover:bg-bg-surface hover:text-ink-secondary"
                  >
                    <RotateCcw size={10} />
                    Retry
                  </button>
                )}
              </div>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="group overflow-hidden rounded-xl border border-subtle bg-bg-elevated shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-subtle px-3.5 py-2">
                    <span className="text-[10px] font-medium text-ink-quaternary">
                      Option {i + 1}
                      {i === 0 ? ' · Conservative' : i === 1 ? ' · Balanced' : ' · Creative'}
                    </span>
                    <button
                      onClick={() => setShowOriginal(showOriginal === i ? null : i)}
                      className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                        showOriginal === i
                          ? 'bg-accent/10 text-accent'
                          : 'text-ink-quaternary hover:bg-bg-surface hover:text-ink-secondary'
                      }`}
                    >
                      {showOriginal === i ? 'Show new' : 'Compare'}
                    </button>
                  </div>

                  <div className="px-3.5 py-3">
                    {showOriginal === i ? (
                      <div className="border-red-muted/20 bg-red-muted/5 rounded-lg border px-3 py-2">
                        <p className="mb-1 text-[10px] font-semibold text-red-muted">Original</p>
                        <p className="text-red-muted/70 text-[12px] leading-relaxed line-through">
                          {selectedText}
                        </p>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink-primary">
                        {s.text}
                      </p>
                    )}
                    {s.rationale && (
                      <p className="mt-2 flex items-start gap-1.5 text-[11px] text-ink-tertiary">
                        <Lightbulb size={11} className="mt-0.5 shrink-0 text-amber-muted" />
                        {s.rationale}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 border-t border-subtle px-3.5 py-2.5">
                    <button
                      onClick={() => onInsert(s.text)}
                      className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-[11px] font-medium text-white transition-all hover:bg-accent-deep active:scale-[0.97]"
                    >
                      <ArrowRight size={11} />
                      Insert
                    </button>
                    <button
                      onClick={() => handleCopy(s.text, i)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-quaternary transition-colors hover:bg-bg-surface hover:text-ink-secondary"
                      title="Copy"
                    >
                      {copiedIdx === i ? (
                        <Check size={13} className="text-sage-muted" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && suggestions.length === 0 && !activeAction && (
            <div className="bg-bg-elevated/50 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-subtle px-4 py-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-bg-elevated">
                <Sparkles size={16} className="text-ink-quaternary" />
              </div>
              <p className="text-center text-[12px] text-ink-quaternary">
                Choose an action to improve this text.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
