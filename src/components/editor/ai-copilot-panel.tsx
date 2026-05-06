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
    label: 'Review PRD ini',
    instruction: 'Review kualitas PRD ini dan berikan feedback yang actionable.',
  },
  {
    label: 'Apa yang kurang?',
    instruction: 'Identifikasi bagian yang masih lemah atau kurang detail dari PRD ini.',
  },
  {
    label: 'Improve overview',
    instruction: 'Improve bagian Overview supaya lebih compelling dan jelas.',
  },
  {
    label: 'Tambah risk baru',
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
    localStorage.setItem(`copilot_chat_${prdId}`, JSON.stringify(messages.slice(-50))); // keep last 50
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
        <ul key={`ul-${elements.length}`} className="my-1 ml-4 list-disc space-y-0.5">
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

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1]!.length;
      const cls =
        level === 1
          ? 'font-bold text-[13px] mt-3 mb-1.5'
          : level === 2
            ? 'font-semibold text-[12.5px] mt-2.5 mb-1'
            : 'font-medium text-[12.5px] mt-2 mb-0.5';
      elements.push(
        <p key={i} className={cls}>
          {inlineFormat(headingMatch[2]!)}
        </p>,
      );
      continue;
    }

    // List items
    const listMatch = line.match(/^\s*[-*•]\s+(.+)$/);
    const olMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (listMatch || olMatch) {
      listItems.push((listMatch?.[1] ?? olMatch?.[1])!);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushList();
      continue;
    }

    // Regular paragraph
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
  // Bold **text** → <strong>
  // Italic *text* → <em>
  // Code `text` → <code>
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(
        <strong key={key++} className="font-semibold text-[#0a0a0a]">
          {match[2]}
        </strong>,
      );
    } else if (match[3]) {
      parts.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(
        <code key={key++} className="rounded bg-[#e8e8e8] px-1 py-0.5 text-[11px]">
          {match[4]}
        </code>,
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

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

  // Load chat history from localStorage
  useEffect(() => {
    if (prdId) {
      setMessages(getChatHistory(prdId));
    }
  }, [prdId]);

  // Use providers from server props (bypasses RLS)
  useEffect(() => {
    if (serverProviders && serverProviders.length > 0) {
      setProviders(serverProviders);
      if (!selectedProviderId) {
        setSelectedProviderId(serverProviders[0]!.id);
      }
    }
  }, [serverProviders]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Save to localStorage when messages change
  useEffect(() => {
    if (prdId && messages.length > 0) {
      saveChatHistory(prdId, messages);
    }
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
        // Edit/regenerate: remove messages from this point onward
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
        // Build chat history for context
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
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Request failed');
        }

        const data = await res.json();
        const aiText = data.suggestions?.[0]?.text ?? data.text ?? 'No response.';
        const modelName = data.model ?? selectedProvider?.display_name ?? 'AI';

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: aiText,
          model: modelName,
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
    // Find the user message before this AI message
    const idx = messages.findIndex((m) => m.id === msg.id);
    if (idx <= 0) return;
    const userMsg = messages[idx - 1];
    if (userMsg?.role !== 'user') return;
    sendMessage(userMsg.content, userMsg.id);
  }

  function handleEditStart(msg: ChatMessage) {
    setEditingId(msg.id);
    setEditText(msg.content);
  }

  function handleEditSubmit(msg: ChatMessage) {
    if (!editText.trim()) return;
    sendMessage(editText.trim(), msg.id);
  }

  const showSuggestions = messages.length === 0 && !loading;

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex h-full w-full max-w-[340px] shrink-0 flex-col border-l border-[#e8e8e6] bg-[#fafaf9] md:static md:z-auto md:w-[320px] md:max-w-none lg:w-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e8e8e6] bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="bg-accent/10 flex h-6 w-6 items-center justify-center rounded-lg">
            <Sparkle size={12} className="text-accent" />
          </div>
          <span className="text-[13px] font-semibold text-[#1a1a1a]">AI Copilot</span>
        </div>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#999] transition-colors hover:bg-[#f0f0ee] hover:text-[#555]"
          onClick={toggleCopilot}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Model selector — only show if >1 provider */}
      {providers.length > 1 && (
        <div className="relative border-b border-[#e8e8e6] bg-white px-4 py-2">
          <button
            onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
            className="flex w-full items-center justify-between rounded-lg border border-[#e8e8e6] bg-[#fafaf9] px-3 py-2 text-[12px] text-[#555] transition-colors hover:border-[#d5d5d3] hover:bg-[#f0f0ee]"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={12} className="text-accent/60" />
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

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {showSuggestions ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 px-2">
            <div className="bg-accent/10 flex h-12 w-12 items-center justify-center rounded-2xl">
              <Sparkle size={20} className="text-accent" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-medium text-[#1a1a1a]">AI Copilot</p>
              <p className="mt-1 text-[12px] text-[#999]">Tanya apa saja tentang PRD ini</p>
            </div>
            <div className="flex w-full flex-col gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.instruction)}
                  className="hover:border-accent/30 hover:bg-accent/5 rounded-xl border border-[#e8e8e6] bg-white px-4 py-2.5 text-left text-[12px] text-[#555] transition-all hover:text-[#1a1a1a]"
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
                  // User message — right aligned
                  <div className="flex justify-end">
                    <div className="max-w-[88%]">
                      {editingId === msg.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full rounded-xl border border-[#ddd] bg-white px-3.5 py-2.5 text-[12.5px] text-[#1a1a1a] focus:border-accent focus:outline-none"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded-lg px-3 py-1.5 text-[11px] text-[#999] hover:bg-[#f0f0ee]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleEditSubmit(msg)}
                              className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-[11px] text-white hover:bg-[#333]"
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="group">
                          <div className="rounded-2xl rounded-br-sm bg-[#1a1a1a] px-4 py-3 text-[12.5px] leading-relaxed text-white">
                            {msg.content}
                          </div>
                          <div className="mt-1 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => handleEditStart(msg)}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-[#ccc] hover:bg-[#f0f0ee] hover:text-[#555]"
                              title="Edit"
                            >
                              <Pencil size={11} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // AI message — left aligned
                  <div className="flex gap-3">
                    <div className="bg-accent/10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl">
                      <Sparkle size={13} className="text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-[12.5px] leading-relaxed text-[#1a1a1a] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                        {renderMarkdown(msg.content)}
                      </div>
                      {/* Model label + actions */}
                      <div className="mt-1.5 flex items-center gap-1">
                        {msg.model && (
                          <span className="mr-1 text-[10px] text-[#bbb]">{msg.model}</span>
                        )}
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-[#ccc] transition-colors hover:bg-[#f0f0ee] hover:text-[#555]"
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
                          className="flex h-6 w-6 items-center justify-center rounded-md text-[#ccc] transition-colors hover:bg-[#f0f0ee] hover:text-[#555] disabled:opacity-30"
                          title="Regenerate"
                        >
                          <RefreshCw size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-3">
                <div className="bg-accent/10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl">
                  <Sparkle size={13} className="text-accent" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-[#bbb]"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-[#bbb]"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-[#bbb]"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-[#e8e8e6] bg-white p-3">
        <div className="focus-within:border-accent/40 flex items-center gap-2 rounded-xl border border-[#e5e5e3] bg-[#fafaf9] px-3 transition-all focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(var(--accent-rgb,0,0,0),0.06)]">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
                e.preventDefault();
                sendMessage(input.trim());
              }
            }}
            placeholder="Ask about this PRD..."
            className="h-10 flex-1 bg-transparent text-[12.5px] text-[#1a1a1a] placeholder:text-[#bbb] focus:outline-none"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => {
              if (input.trim()) sendMessage(input.trim());
            }}
            disabled={!input.trim() || loading}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a1a1a] text-white transition-all hover:bg-[#333] disabled:bg-[#e5e5e3] disabled:text-[#bbb]"
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
