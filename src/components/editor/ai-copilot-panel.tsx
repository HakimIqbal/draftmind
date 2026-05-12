'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronRight,
  Send,
  Copy,
  Check,
  RefreshCw,
  Pencil,
  ChevronDown,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEditorStore } from '@/stores/editor-store';
import { Sparkle } from '@/components/icons/sparkle';

// ── Types ──

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: number;
}

interface ProviderOption {
  id: string;
  display_name: string;
  default_model: string;
}

const SUGGESTED_PROMPTS = [
  {
    label: 'Review this PRD',
    instruction: 'Review kualitas PRD ini dan berikan feedback yang actionable.',
  },
  {
    label: "What's missing?",
    instruction: 'Identifikasi bagian yang masih lemah atau kurang detail dari PRD ini.',
  },
  {
    label: 'Improve overview',
    instruction: 'Improve bagian Overview supaya lebih compelling dan jelas.',
  },
  {
    label: 'Suggest new risks',
    instruction: 'Suggest 2-3 risks baru yang spesifik untuk project ini beserta mitigasinya.',
  },
];

// ── LocalStorage helpers ──

function getChatHistory(prdId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`copilot_chat_${prdId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChatHistory(prdId: string, messages: ChatMessage[]) {
  try {
    localStorage.setItem(`copilot_chat_${prdId}`, JSON.stringify(messages.slice(-50)));
  } catch {
    /* ignore */
  }
}

// ── Markdown renderer ──

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          className="my-1.5 ml-4 list-disc space-y-1 text-ink-secondary"
        >
          {listItems.map((item, i) => (
            <li key={i}>{inlineFormat(item)}</li>
          ))}
        </ul>,
      );
      listItems = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1]!.length;
      const cls =
        level === 1
          ? 'font-bold text-[13px] text-ink-primary mt-3 mb-1.5'
          : level === 2
            ? 'font-semibold text-[12.5px] text-ink-primary mt-2.5 mb-1'
            : 'font-medium text-[12.5px] text-ink-primary mt-2 mb-0.5';
      elements.push(
        <p key={i} className={cls}>
          {inlineFormat(headingMatch[2]!)}
        </p>,
      );
      continue;
    }
    const listMatch = line.match(/^\s*[-*•]\s+(.+)$/);
    const olMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (listMatch || olMatch) {
      listItems.push((listMatch?.[1] ?? olMatch?.[1])!);
      continue;
    }
    if (line.trim() === '') {
      flushList();
      continue;
    }
    flushList();
    elements.push(
      <p key={i} className="mb-1.5 last:mb-0">
        {inlineFormat(line)}
      </p>,
    );
  }
  flushList();
  return elements;
}

function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2])
      parts.push(
        <strong key={key++} className="font-semibold text-ink-primary">
          {match[2]}
        </strong>,
      );
    else if (match[3]) parts.push(<em key={key++}>{match[3]}</em>);
    else if (match[4])
      parts.push(
        <code key={key++} className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px]">
          {match[4]}
        </code>,
      );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? <>{parts}</> : text;
}

// ── Component ──

interface AICopilotPanelProps {
  prdId?: string;
  userName?: string;
  serverProviders?: ProviderOption[];
}

export function AICopilotPanel({
  prdId,
  userName: _userName,
  serverProviders,
}: AICopilotPanelProps) {
  const { toggleCopilot, currentSection } = useEditorStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prdId) setMessages(getChatHistory(prdId));
  }, [prdId]);
  useEffect(() => {
    if (serverProviders && serverProviders.length > 0) {
      setProviders(serverProviders);
      if (!selectedProviderId) setSelectedProviderId(serverProviders[0]!.id);
    }
  }, [serverProviders]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);
  useEffect(() => {
    if (prdId && messages.length > 0) saveChatHistory(prdId, messages);
  }, [prdId, messages]);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);

  const sendMessage = useCallback(
    async (text: string, replaceFromId?: string) => {
      if (!prdId || !text.trim() || loading) return;
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
      };
      let newMessages: ChatMessage[];
      if (replaceFromId) {
        const idx = messages.findIndex((m) => m.id === replaceFromId);
        newMessages = [...messages.slice(0, idx), userMsg];
      } else {
        newMessages = [...messages, userMsg];
      }
      setMessages(newMessages);
      setInput('');
      setEditingId(null);
      setLoading(true);
      try {
        const history = newMessages
          .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n\n');
        const res = await fetch('/api/prd/ai-suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prdId,
            action: 'copilot',
            instruction: text.trim(),
            sectionKey: currentSection,
            chatHistory: history,
            providerId: selectedProviderId || undefined,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Request failed');
        }
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.suggestions?.[0]?.text ?? data.text ?? 'No response.',
          model: data.model ?? selectedProvider?.display_name ?? 'AI',
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to get AI response');
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [prdId, loading, messages, currentSection, selectedProviderId, selectedProvider],
  );

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied!');
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleRegenerate(msg: ChatMessage) {
    const idx = messages.findIndex((m) => m.id === msg.id);
    if (idx <= 0) return;
    const userMsg = messages[idx - 1];
    if (userMsg?.role !== 'user') return;
    sendMessage(userMsg.content, userMsg.id);
  }

  function handleClearHistory() {
    if (prdId) {
      localStorage.removeItem(`copilot_chat_${prdId}`);
      setMessages([]);
    }
  }

  const showSuggestions = messages.length === 0 && !loading;

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex h-full w-full max-w-[340px] shrink-0 flex-col border-l border-subtle bg-bg-surface md:static md:z-auto md:w-[320px] md:max-w-none lg:w-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-subtle bg-bg-elevated px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-accent/10 flex h-7 w-7 items-center justify-center rounded-lg">
            <Sparkle size={13} className="text-accent" />
          </div>
          <span className="text-[13px] font-semibold text-ink-primary">AI Copilot</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-quaternary transition-colors hover:bg-bg-surface hover:text-ink-secondary"
              title="Clear chat"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-tertiary transition-colors hover:bg-bg-surface hover:text-ink-primary"
            onClick={toggleCopilot}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Model selector */}
      {providers.length > 1 && (
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

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {showSuggestions ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 px-2">
            <div className="bg-accent/10 flex h-12 w-12 items-center justify-center rounded-2xl">
              <Sparkle size={20} className="text-accent" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-medium text-ink-primary">AI Copilot</p>
              <p className="mt-1 text-[12px] text-ink-tertiary">Ask anything about this PRD</p>
            </div>
            <div className="flex w-full flex-col gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.instruction)}
                  className="hover:border-accent/30 hover:bg-accent/5 rounded-xl border border-subtle bg-bg-elevated px-4 py-2.5 text-left text-[12px] text-ink-secondary transition-all hover:text-ink-primary"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="group max-w-[85%]">
                      {editingId === msg.id ? (
                        <div className="border-accent/20 rounded-2xl border-2 bg-white p-3 shadow-md">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full resize-none rounded-lg bg-transparent text-[12.5px] leading-relaxed text-ink-primary placeholder:text-ink-quaternary focus:outline-none"
                            rows={3}
                            autoFocus
                          />
                          <div className="mt-2 flex items-center justify-end gap-2 border-t border-black/[0.06] pt-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-ink-tertiary transition-colors hover:bg-bg-surface"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                if (editText.trim() && editText.trim() !== msg.content)
                                  sendMessage(editText.trim(), msg.id);
                              }}
                              disabled={!editText.trim() || editText.trim() === msg.content}
                              className="rounded-lg bg-[#1a1a1a] px-4 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="border-accent/20 bg-accent/10 rounded-2xl rounded-br-sm border px-4 py-2.5 text-[12.5px] leading-relaxed text-ink-primary">
                            {msg.content}
                          </div>
                          <div className="mt-1 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => {
                                setEditingId(msg.id);
                                setEditText(msg.content);
                              }}
                              className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-ink-tertiary transition-colors hover:bg-black/[0.05] hover:text-ink-secondary"
                            >
                              <Pencil size={10} />
                              Edit
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="bg-accent/10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl">
                      <Sparkle size={13} className="text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="rounded-2xl rounded-tl-sm bg-bg-elevated px-4 py-3 text-[12.5px] leading-relaxed text-ink-primary shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                        {renderMarkdown(msg.content)}
                        <div className="mt-2 flex items-center gap-1.5 border-t border-black/[0.08] pt-2">
                          {msg.model && (
                            <span className="mr-auto text-[10px] font-medium text-ink-tertiary">
                              {msg.model}
                            </span>
                          )}
                          <button
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-black/[0.05] hover:text-ink-primary"
                            title="Copy"
                          >
                            {copiedId === msg.id ? (
                              <Check size={12} className="text-emerald-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                          <button
                            onClick={() => handleRegenerate(msg)}
                            disabled={loading}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-black/[0.05] hover:text-ink-primary disabled:opacity-30"
                            title="Regenerate"
                          >
                            <RefreshCw size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="bg-accent/10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl">
                  <Sparkle size={13} className="animate-pulse text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl rounded-tl-sm bg-bg-elevated px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1">
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent"
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent"
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                      <span className="text-[11px] text-ink-tertiary">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-subtle bg-bg-elevated px-4 py-3">
        <div className="focus-within:border-accent/40 flex items-end gap-2 rounded-2xl border border-subtle bg-bg-surface px-3 py-2 transition-all focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(232,116,60,0.06)]">
          <textarea
            ref={inputRef as unknown as React.RefObject<HTMLTextAreaElement>}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
                e.preventDefault();
                sendMessage(input.trim());
                (e.target as HTMLTextAreaElement).style.height = 'auto';
              }
            }}
            placeholder="Ask about this PRD..."
            className="max-h-[120px] min-h-[36px] flex-1 resize-none bg-transparent text-[12.5px] leading-relaxed text-ink-primary placeholder:text-ink-quaternary focus:outline-none"
            rows={1}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => {
              if (input.trim()) sendMessage(input.trim());
            }}
            disabled={!input.trim() || loading}
            className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-all hover:bg-accent-deep disabled:bg-bg-surface disabled:text-ink-quaternary"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
