'use client';

import { useState } from 'react';
import { Plus, Play, Pencil, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PROVIDER_REGISTRY, type ProviderType } from '@/lib/ai/providers';
import {
  AnthropicIcon,
  OpenAIIcon,
  GeminiIcon,
  GroqIcon,
  SumopodIcon,
  GanRouterIcon,
} from '@/components/icons/provider';
import { AddProviderWizard } from './add-provider-wizard';
import { cn } from '@/lib/utils/cn';

// ── Types ──

export interface ProviderRow {
  id: string;
  provider_type: string;
  display_name: string;
  status: 'active' | 'disconnected' | 'error';
  is_default: boolean;
  model: string;
  base_url?: string | null;
}

interface ProvidersListProps {
  providers: ProviderRow[];
  workspaceId: string;
}

// ── Provider icon map ──

const PROVIDER_ICON: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  anthropic: AnthropicIcon,
  openai: OpenAIIcon,
  gemini: GeminiIcon,
  groq: GroqIcon,
  sumopod: SumopodIcon,
  ganrouter: GanRouterIcon,
};

// ── Status styling ──

function statusStyles(status: ProviderRow['status']) {
  switch (status) {
    case 'active':
      return { dot: 'bg-sage', label: 'Active', textClass: 'text-sage' };
    case 'disconnected':
      return { dot: 'bg-ink-tertiary', label: 'Disconnected', textClass: 'text-ink-tertiary' };
    case 'error':
      return { dot: 'bg-red-muted', label: 'Error', textClass: 'text-red-muted' };
  }
}

// ── Component ──

export function ProvidersList({ providers, workspaceId }: ProvidersListProps) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, 'loading' | 'success' | 'error'>>(
    {},
  );

  const configuredTypes = new Set(providers.map((p) => p.provider_type));
  const unconfiguredTypes = Object.keys(PROVIDER_REGISTRY).filter(
    (t) => !configuredTypes.has(t),
  ) as ProviderType[];

  async function handleTest(provider: ProviderRow) {
    setTestResults((prev) => ({ ...prev, [provider.id]: 'loading' }));
    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: provider.id }),
      });
      setTestResults((prev) => ({
        ...prev,
        [provider.id]: res.ok ? 'success' : 'error',
      }));
    } catch {
      setTestResults((prev) => ({ ...prev, [provider.id]: 'error' }));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">LLM Providers</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Connect AI providers to power PRD generation.
          </p>
        </div>
        <Button variant="primary-fill" size="md" onClick={() => setWizardOpen(true)}>
          <Plus size={16} className="mr-1.5" />
          Add provider
        </Button>
      </div>

      {/* Configured providers */}
      <div className="space-y-3">
        {providers.map((provider) => {
          const Icon = PROVIDER_ICON[provider.provider_type];
          const st = statusStyles(provider.status);
          const testResult = testResults[provider.id];

          return (
            <Card key={provider.id} className="flex items-center gap-4 p-4">
              {/* Icon */}
              <div className="border-default flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border bg-bg-surface">
                {Icon ? <Icon size={20} className="text-ink-secondary" /> : null}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink-primary">
                    {provider.display_name}
                  </span>
                  {provider.is_default && (
                    <span className="bg-accent/10 border-accent/20 inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
                      Default
                    </span>
                  )}
                  {/* Status */}
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                    <span className={cn('font-mono text-xs', st.textClass)}>{st.label}</span>
                  </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-xs text-ink-tertiary">
                  Model: {provider.model}
                </p>
              </div>

              {/* Test result inline */}
              {testResult && testResult !== 'loading' && (
                <span
                  className={cn(
                    'rounded px-2 py-0.5 font-mono text-xs',
                    testResult === 'success'
                      ? 'bg-sage/10 text-sage'
                      : 'bg-red-muted/10 text-red-muted',
                  )}
                >
                  {testResult === 'success' ? 'OK' : 'Failed'}
                </span>
              )}

              {/* Actions */}
              <div className="flex flex-shrink-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTest(provider)}
                  disabled={testResult === 'loading'}
                >
                  <Play size={14} className="mr-1" />
                  {testResult === 'loading' ? 'Testing...' : 'Test'}
                </Button>
                <Button variant="ghost" size="sm">
                  <Pencil size={14} className="mr-1" />
                  Edit
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Unconfigured providers */}
      {unconfiguredTypes.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-mono text-sm uppercase tracking-wider text-ink-tertiary">
            Available to connect
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unconfiguredTypes.map((type) => {
              const config = PROVIDER_REGISTRY[type];
              const Icon = PROVIDER_ICON[type];
              return (
                <Card
                  key={type}
                  className="flex cursor-pointer flex-col items-center gap-3 border-dashed p-4 transition-colors hover:border-strong"
                  onClick={() => setWizardOpen(true)}
                >
                  <div className="border-default flex h-10 w-10 items-center justify-center rounded-md border bg-bg-surface">
                    {Icon ? <Icon size={20} className="text-ink-tertiary" /> : null}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-ink-primary">{config?.displayName}</p>
                    <p className="mt-0.5 text-xs text-ink-tertiary">
                      <Unplug size={12} className="mr-1 inline" />
                      Connect
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Wizard dialog */}
      <AddProviderWizard open={wizardOpen} onOpenChange={setWizardOpen} workspaceId={workspaceId} />
    </div>
  );
}
