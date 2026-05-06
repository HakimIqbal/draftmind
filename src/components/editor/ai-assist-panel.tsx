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
  Send,
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
  { action: 'rewrite', label: 'Rewrite', icon: RefreshCw, desc: 'Clearer & more direct' },
  { action: 'expand', label: 'Expand', icon: Maximize2, desc: 'Add detail & context' },
  { action: 'summarize', label: 'Summarize', icon: AlignLeft, desc: 'Condense to key points' },
  { action: 'shorter', label: 'Shorter', icon: Minimize2, desc: 'Cut 40-60%' },
  { action: 'formal', label: 'More formal', icon: GraduationCap, desc: 'Professional tone' },
  { action: 'grammar', label: 'Fix grammar', icon: CheckCheck, desc: 'Fix spelling & syntax' },
] as const;

const MORE_ACTIONS = [
  { action: 'translate', label: 'Translate', icon: Languages, desc: 'Auto-detect ID↔EN' },
  { action: 'add_examples', label: 'Add examples', icon: Lightbulb, desc: 'Concrete examples' },
  {
    action: 'make_actionable',
    label: 'Make actionable',
    icon: Target,
    desc: 'Convert to action items',
  },
  { action: 'add_metrics', label: 'Add metrics', icon: BarChart3, desc: 'Add KPIs & targets' },
  { action: 'simplify_jargon', label: 'Simplify jargon', icon: BookOpen, desc: 'Plain language' },
  { action: 'to_table', label: 'To table', icon: Table2, desc: 'Table format' },
  { action: 'to_list', label: 'To list', icon: List, desc: 'Bullet list format' },
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
  const [customInstruction, setCustomInstruction] = useState('');
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
          customInstruction: action === 'custom' ? customInstruction : undefined,
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
    <div className="fixed inset-y-0 right-0 z-40 flex h-full w-full max-w-[340px] shrink-0 flex-col border-l border-[#e8e8e6] bg-[#fafaf9] md:static md:z-auto md:w-[320px] md:max-w-none lg:w-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e8e8e6] bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
            <Sparkle size={13} className="text-violet-500" />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-[#1a1a1a]">AI Assist</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#999] transition-colors hover:bg-[#f0f0ee] hover:text-[#555]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Selected text preview */}
      <div className="border-b border-[#e8e8e6] bg-white px-4 py-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999]">
            Selected text
          </p>
        </div>
        <div className="rounded-lg border border-[#f0f0ee] bg-[#fafaf9] px-3 py-2.5">
          <p className="line-clamp-3 text-[12px] leading-relaxed text-[#555]">{truncated}</p>
        </div>
      </div>

      {/* Model selector — only show if >1 provider */}
      {providers && providers.length > 1 && (
        <div className="relative border-b border-[#e8e8e6] bg-white px-4 py-2">
          <button
            onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
            className="flex w-full items-center justify-between rounded-lg border border-[#e8e8e6] bg-[#fafaf9] px-3 py-2 text-[12px] text-[#555] transition-colors hover:border-[#d5d5d3] hover:bg-[#f0f0ee]"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={12} className="text-violet-400" />
              {selectedProvider?.display_name ?? 'Select model'}
            </span>
            <ChevronDown
              size={13}
              className={`text-[#999] transition-transform ${providerDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {providerDropdownOpen && (
            <div className="absolute left-4 right-4 top-full z-20 mt-1 overflow-hidden rounded-xl border border-[#e8e8e6] bg-white shadow-lg">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProviderId(p.id);
                    setProviderDropdownOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[12px] transition-colors hover:bg-[#fafaf9] ${p.id === selectedProviderId ? 'bg-[#f5f5f4] font-medium text-[#1a1a1a]' : 'text-[#555]'}`}
                >
                  <span className="flex-1">{p.display_name}</span>
                  <span className="text-[10px] text-[#bbb]">{p.default_model}</span>
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
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999]">
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
                  ? 'border-violet-200 bg-violet-50 shadow-[0_0_0_1px_rgba(139,92,246,0.1)]'
                  : 'border-[#e8e8e6] bg-white hover:border-violet-200 hover:bg-violet-50/50 hover:shadow-sm'
              } disabled:pointer-events-none disabled:opacity-40`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  activeAction === action
                    ? 'bg-violet-100 text-violet-600'
                    : 'bg-[#f5f5f4] text-[#999] group-hover:bg-violet-100 group-hover:text-violet-500'
                }`}
              >
                <Icon size={14} />
              </div>
              <span
                className={`text-[12px] font-medium ${activeAction === action ? 'text-violet-700' : 'text-[#333]'}`}
              >
                {label}
              </span>
              <span className="text-[10px] leading-tight text-[#aaa]">{desc}</span>
            </button>
          ))}
        </div>

        {/* More actions */}
        <div className="px-4">
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#999] transition-colors hover:text-[#666]"
          >
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
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
            {MORE_ACTIONS.map(({ action, label, icon: Icon, desc }) => (
              <button
                key={action}
                disabled={loading}
                onClick={() => handleAction(action)}
                className={`group flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                  activeAction === action
                    ? 'border-violet-200 bg-violet-50 shadow-[0_0_0_1px_rgba(139,92,246,0.1)]'
                    : 'border-[#e8e8e6] bg-white hover:border-violet-200 hover:bg-violet-50/50 hover:shadow-sm'
                } disabled:pointer-events-none disabled:opacity-40`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                    activeAction === action
                      ? 'bg-violet-100 text-violet-600'
                      : 'bg-[#f5f5f4] text-[#999] group-hover:bg-violet-100 group-hover:text-violet-500'
                  }`}
                >
                  <Icon size={14} />
                </div>
                <span
                  className={`text-[12px] font-medium ${activeAction === action ? 'text-violet-700' : 'text-[#333]'}`}
                >
                  {label}
                </span>
                <span className="text-[10px] leading-tight text-[#aaa]">{desc}</span>
              </button>
            ))}
          </div>
        )}

        {/* Custom instruction */}
        <div className="border-t border-[#e8e8e6] px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999]">
              Custom Instruction
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#e5e5e3] bg-white px-3 transition-all focus-within:border-violet-300 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.06)]">
            <input
              type="text"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customInstruction.trim()) handleAction('custom');
              }}
              placeholder="e.g. Convert to Given/When/Then..."
              className="h-10 flex-1 bg-transparent text-[12px] text-[#1a1a1a] placeholder:text-[#bbb] focus:outline-none"
              disabled={loading}
            />
            <button
              onClick={() => {
                if (customInstruction.trim()) handleAction('custom');
              }}
              disabled={!customInstruction.trim() || loading}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1a1a1a] text-white transition-all hover:bg-[#333] disabled:bg-[#e5e5e3] disabled:text-[#bbb]"
            >
              <Send size={12} />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="border-t border-[#e8e8e6] px-4 pb-6 pt-3">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-violet-100 border-t-violet-500" />
                <Sparkle size={16} className="text-violet-500" />
              </div>
              <div className="text-center">
                <p className="text-[12px] font-medium text-[#555]">Generating suggestions...</p>
                <p className="mt-0.5 text-[11px] text-[#bbb]">{activeLabel}</p>
              </div>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999]">
                    {suggestions.length} Suggestion{suggestions.length > 1 ? 's' : ''}
                  </p>
                </div>
                {activeAction && (
                  <button
                    onClick={() => handleAction(activeAction)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-[#bbb] transition-colors hover:bg-[#f0f0ee] hover:text-[#555]"
                  >
                    <RotateCcw size={10} />
                    Retry
                  </button>
                )}
              </div>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="group overflow-hidden rounded-xl border border-[#e8e8e6] bg-white shadow-sm transition-all hover:shadow-md"
                >
                  {/* Suggestion header */}
                  <div className="flex items-center justify-between border-b border-[#f5f5f4] px-3.5 py-2">
                    <span className="text-[10px] font-medium text-[#bbb]">
                      Option {i + 1}
                      {i === 0 ? ' · Conservative' : i === 1 ? ' · Balanced' : ' · Creative'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowOriginal(showOriginal === i ? null : i)}
                        className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                          showOriginal === i
                            ? 'bg-violet-50 text-violet-600'
                            : 'text-[#ccc] hover:bg-[#f5f5f4] hover:text-[#777]'
                        }`}
                      >
                        {showOriginal === i ? 'Show new' : 'Compare'}
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-3.5 py-3">
                    {showOriginal === i ? (
                      <div className="space-y-2">
                        <div className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-2">
                          <p className="mb-1 text-[10px] font-semibold text-red-400">Original</p>
                          <p className="text-[12px] leading-relaxed text-red-400/80 line-through">
                            {selectedText}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-[#1a1a1a]">
                        {s.text}
                      </p>
                    )}
                    {s.rationale && (
                      <p className="mt-2 flex items-start gap-1.5 text-[11px] text-[#aaa]">
                        <Lightbulb size={11} className="mt-0.5 shrink-0 text-amber-400" />
                        {s.rationale}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 border-t border-[#f5f5f4] px-3.5 py-2.5">
                    <button
                      onClick={() => onInsert(s.text)}
                      className="flex items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-3.5 py-1.5 text-[11px] font-medium text-white transition-all hover:bg-[#333] active:scale-[0.97]"
                    >
                      <ArrowRight size={11} />
                      Insert
                    </button>
                    <button
                      onClick={() => handleCopy(s.text, i)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#ccc] transition-colors hover:bg-[#f5f5f4] hover:text-[#555]"
                      title="Copy"
                    >
                      {copiedIdx === i ? (
                        <Check size={13} className="text-emerald-500" />
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
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f0f0ee]">
                <Sparkles size={16} className="text-[#ccc]" />
              </div>
              <p className="text-center text-[12px] text-[#bbb]">
                Select an action or type a custom instruction
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
