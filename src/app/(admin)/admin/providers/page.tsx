'use client';

import { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { getProviderIcon } from '@/lib/ai/provider-icons';
import {
  Plus,
  Wifi,
  WifiOff,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  Loader2,
  Zap,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  getProviders,
  getProviderRegistry,
  validateBaseUrl,
  testProviderConnection,
  addProvider,
  disconnectProvider,
  activateProvider,
  deleteProvider,
  updateProviderPriority,
  updateProviderUseFor,
} from './actions';

interface Provider {
  id: string;
  type: string;
  display_name: string;
  status: string;
  is_default: boolean;
  default_model: string;
  base_url: string | null;
  priority: number;
  use_for: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_latency_ms: number;
  last_used_at: string | null;
  last_error: string | null;
  created_at: string;
}

interface RegistryItem {
  key: string;
  displayName: string;
  defaultModel: string;
  availableModels: string[];
  requiresBaseUrl: boolean;
  defaultBaseUrl?: string;
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [registry, setRegistry] = useState<RegistryItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load providers + registry on mount and after actions
  useEffect(() => {
    async function load() {
      try {
        const [p, r] = await Promise.all([getProviders(), getProviderRegistry()]);
        setProviders(p as Provider[]);
        setRegistry(r);
      } catch {
        /* stale action after HMR */
      }
    }
    load();
  }, [isPending]);

  // Real-time polling every 10 seconds for Requests & Latency updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const p = await getProviders();
        setProviders(p as Provider[]);
      } catch {
        /* ignore */
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  function handle(fn: () => Promise<unknown>, msg: string) {
    startTransition(async () => {
      const result = await fn();
      if (
        result &&
        typeof result === 'object' &&
        'error' in result &&
        typeof result.error === 'string'
      ) {
        toast.error(result.error);
        return;
      }
      toast.success(msg);
    });
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a1a1a]">AI Providers</h1>
          <p className="mt-0.5 text-[13px] text-[#888]">
            Smart router with priority-based fallback
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-4 text-[13px] font-medium text-white hover:opacity-90"
        >
          <Plus size={14} /> Add provider
        </button>
      </div>

      {/* How it works */}
      <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
        <p className="text-[12px] text-blue-700">
          Requests are routed to Priority 1 first. If it fails, the system automatically tries
          Priority 2, then 3, and so on.
        </p>
      </div>

      {/* Provider list */}
      {providers.length === 0 ? (
        <div className="rounded-xl border border-[#eee] bg-white px-5 py-16 text-center">
          <Zap size={24} className="mx-auto text-[#ddd]" />
          <p className="mt-3 text-[14px] font-medium text-[#1a1a1a]">No providers configured</p>
          <p className="mt-1 text-[12px] text-[#999]">
            Add an AI provider to enable PRD generation
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#eee]">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[#f0f0f0] bg-[#fafaf9]">
                <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  Priority
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  Provider
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  Use For
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  Requests
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  Latency
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[#999]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p, i) => {
                const successRate =
                  p.total_requests > 0
                    ? Math.round((p.successful_requests / p.total_requests) * 100)
                    : 0;
                return (
                  <tr key={p.id} className="border-b border-[#f5f5f5] hover:bg-[#fafaf9]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f5f5f4] text-[12px] font-bold text-[#666]">
                          {p.priority}
                        </span>
                        <div className="flex flex-col">
                          {i > 0 && (
                            <button
                              onClick={() =>
                                handle(
                                  () => updateProviderPriority(p.id, p.priority - 1),
                                  'Priority updated',
                                )
                              }
                              className="rounded p-0.5 text-[#999] hover:bg-[#f5f5f4] hover:text-[#333]"
                            >
                              <ArrowUp size={11} />
                            </button>
                          )}
                          {i < providers.length - 1 && (
                            <button
                              onClick={() =>
                                handle(
                                  () => updateProviderPriority(p.id, p.priority + 1),
                                  'Priority updated',
                                )
                              }
                              className="rounded p-0.5 text-[#999] hover:bg-[#f5f5f4] hover:text-[#333]"
                            >
                              <ArrowDown size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const icon = getProviderIcon(p.type);
                          return icon ? (
                            <Image
                              src={icon}
                              alt={p.display_name}
                              width={24}
                              height={24}
                              className="shrink-0 rounded-md"
                            />
                          ) : (
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#f5f5f4] text-[10px] font-bold text-[#999]">
                              {p.display_name[0]}
                            </div>
                          );
                        })()}
                        <div>
                          <p className="text-[13px] font-semibold text-[#1a1a1a]">
                            {p.display_name}
                          </p>
                          <p className="text-[11px] text-[#999]">{p.default_model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={p.use_for}
                        onChange={(e) =>
                          handle(() => updateProviderUseFor(p.id, e.target.value), 'Updated')
                        }
                        className="h-7 rounded border border-[#e5e5e3] bg-white px-2 text-[11px] text-[#666]"
                      >
                        <option value="all">All</option>
                        <option value="fallback">Fallback</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${p.status === 'active' ? 'bg-emerald-400' : 'bg-[#ccc]'}`}
                        />
                        <span className="text-[12px] capitalize text-[#666]">{p.status}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[12px] text-[#1a1a1a]">{p.total_requests}</p>
                      {p.total_requests > 0 && (
                        <p className="text-[10px] text-[#999]">{successRate}% success</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] text-[#888]">
                        {p.avg_latency_ms > 0 ? `${p.avg_latency_ms}ms` : '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.status === 'active' ? (
                          <button
                            onClick={() => handle(() => disconnectProvider(p.id), 'Disconnected')}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1.5 text-[11px] font-medium text-[#666] hover:border-amber-100 hover:bg-amber-50 hover:text-amber-600"
                            title="Disconnect"
                          >
                            <WifiOff size={14} />
                            <span className="hidden xl:inline">Disconnect</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handle(() => activateProvider(p.id), 'Activated')}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1.5 text-[11px] font-medium text-[#666] hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-600"
                            title="Activate"
                          >
                            <Wifi size={14} />
                            <span className="hidden xl:inline">Activate</span>
                          </button>
                        )}
                        <button
                          onClick={() => handle(() => deleteProvider(p.id), 'Deleted')}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1.5 text-[11px] font-medium text-[#666] hover:border-red-100 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                          <span className="hidden xl:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddProviderModal
          registry={registry}
          existingCount={providers.length}
          onClose={() => setShowAdd(false)}
          isPending={isPending}
          startTransition={startTransition}
        />
      )}
    </div>
  );
}

function AddProviderModal({
  registry,
  existingCount,
  onClose,
  isPending,
  startTransition,
}: {
  registry: RegistryItem[];
  existingCount: number;
  onClose: () => void;
  isPending: boolean;
  startTransition: (cb: () => Promise<void>) => void;
}) {
  const [step, setStep] = useState<'select' | 'baseurl' | 'apikey' | 'test'>('select');
  const [selected, setSelected] = useState<RegistryItem | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState('');
  const [useFor, setUseFor] = useState('all');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latency?: number;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  function handleSelect(item: RegistryItem) {
    setSelected(item);
    setModel(item.defaultModel);
    if (item.requiresBaseUrl) {
      setBaseUrl(item.defaultBaseUrl ?? '');
      setStep('baseurl');
    } else {
      setStep('apikey');
    }
  }

  async function handleValidateUrl() {
    const r = await validateBaseUrl(baseUrl);
    if (r.valid) setStep('apikey');
    else toast.error(r.message);
  }

  async function handleTest() {
    if (!selected) return;
    setTesting(true);
    setTestResult(null);
    const r = await testProviderConnection({
      type: selected.key,
      apiKey,
      baseUrl: baseUrl || undefined,
      model,
    });
    setTestResult(r);
    setTesting(false);
    if (r.success) setStep('test');
  }

  function handleSave() {
    if (!selected) return;
    startTransition(async () => {
      const r = await addProvider({
        type: selected.key,
        displayName: selected.displayName,
        apiKey,
        baseUrl: baseUrl || undefined,
        model,
        priority: existingCount + 1,
        useFor,
      });
      if (r.error) toast.error(r.error);
      else {
        toast.success('Provider added');
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl max-sm:w-[calc(100vw-2rem)] sm:p-6 md:p-8">
        <button onClick={onClose} className="absolute right-4 top-4 text-[#bbb] hover:text-[#666]">
          <X size={18} />
        </button>

        {step === 'select' && (
          <>
            <h2 className="text-[18px] font-bold text-[#1a1a1a]">Add AI Provider</h2>
            <p className="mt-1 text-[13px] text-[#888]">Choose a provider to connect</p>
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {registry.map((item) => {
                const icon = getProviderIcon(item.key);
                return (
                  <button
                    key={item.key}
                    onClick={() => handleSelect(item)}
                    className="flex items-center gap-3 rounded-xl border border-[#eee] bg-white p-4 text-left transition-all hover:border-[#ddd] hover:shadow-sm"
                  >
                    {icon ? (
                      <Image
                        src={icon}
                        alt={item.displayName}
                        width={28}
                        height={28}
                        className="shrink-0 rounded-md"
                      />
                    ) : (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#f5f5f4] text-[11px] font-bold text-[#999]">
                        {item.displayName[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-[14px] font-semibold text-[#1a1a1a]">{item.displayName}</p>
                      <p className="mt-0.5 text-[11px] text-[#999]">
                        {item.availableModels.length} models
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 'baseurl' && selected && (
          <>
            <div className="flex items-center gap-3">
              {getProviderIcon(selected.key) && (
                <Image
                  src={getProviderIcon(selected.key)!}
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-md"
                />
              )}
              <h2 className="text-[18px] font-bold text-[#1a1a1a]">{selected.displayName}</h2>
            </div>
            <p className="mt-1 text-[13px] text-[#888]">Verify the base URL</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
                  Base URL <span className="text-red-400">*</span>
                </label>
                <input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://..."
                  className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('select')}
                  className="h-9 flex-1 rounded-lg border border-[#e5e5e3] text-[13px] font-medium text-[#666] hover:bg-[#fafaf9]"
                >
                  Back
                </button>
                <button
                  onClick={handleValidateUrl}
                  disabled={!baseUrl.trim()}
                  className="h-9 flex-1 rounded-lg bg-[#1a1a1a] text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-30"
                >
                  Continue
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'apikey' && selected && (
          <>
            <div className="flex items-center gap-3">
              {getProviderIcon(selected.key) && (
                <Image
                  src={getProviderIcon(selected.key)!}
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-md"
                />
              )}
              <h2 className="text-[18px] font-bold text-[#1a1a1a]">{selected.displayName}</h2>
            </div>
            <p className="mt-1 text-[13px] text-[#888]">Enter API key and configure</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
                  API Key <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 pr-10 text-[13px] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#666]"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] focus:border-accent focus:outline-none focus:ring-1"
                >
                  {selected.availableModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
                  Use for
                </label>
                <select
                  value={useFor}
                  onChange={(e) => setUseFor(e.target.value)}
                  className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] focus:border-accent focus:outline-none focus:ring-1"
                >
                  <option value="all">All requests</option>
                  <option value="fallback">Fallback only</option>
                </select>
              </div>

              {testResult && (
                <div
                  className={`rounded-lg p-3 text-[13px] ${testResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}
                >
                  {testResult.success ? (
                    <Check size={14} className="mr-1 inline" />
                  ) : (
                    <X size={14} className="mr-1 inline" />
                  )}
                  {testResult.message}
                  {testResult.latency ? ` (${testResult.latency}ms)` : ''}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    selected.requiresBaseUrl ? setStep('baseurl') : setStep('select')
                  }
                  className="h-9 flex-1 rounded-lg border border-[#e5e5e3] text-[13px] font-medium text-[#666] hover:bg-[#fafaf9]"
                >
                  Back
                </button>
                <button
                  onClick={handleTest}
                  disabled={!apiKey.trim() || testing}
                  className="h-9 flex-1 rounded-lg bg-[#1a1a1a] text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-30"
                >
                  {testing ? (
                    <>
                      <Loader2 size={14} className="mr-1 inline animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'test' && selected && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <Check size={24} className="text-emerald-500" />
            </div>
            <h2 className="text-[18px] font-bold text-[#1a1a1a]">Connection successful</h2>
            <p className="mt-1 text-[13px] text-[#888]">
              {selected.displayName} · {model}
              {testResult?.latency ? ` · ${testResult.latency}ms` : ''}
            </p>
            <p className="mt-2 text-[12px] text-[#bbb]">
              Will be added as Priority {existingCount + 1}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep('apikey')}
                className="h-9 flex-1 rounded-lg border border-[#e5e5e3] text-[13px] font-medium text-[#666] hover:bg-[#fafaf9]"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="h-9 flex-1 rounded-lg bg-accent text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-30"
              >
                {isPending ? 'Saving...' : 'Save Provider'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
