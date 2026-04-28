'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioCardGroup, RadioCardItem } from '@/components/ui/radio-card';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { PROVIDER_REGISTRY, type ProviderType } from '@/lib/ai/providers';
import {
  AnthropicIcon,
  OpenAIIcon,
  GeminiIcon,
  GroqIcon,
  SumopodIcon,
  GanRouterIcon,
} from '@/components/icons/provider';
import { addProvider, testProvider } from '@/app/(app)/settings/providers/actions';
import { cn } from '@/lib/utils/cn';

// ── Constants ──

const PROVIDER_ICON: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  anthropic: AnthropicIcon,
  openai: OpenAIIcon,
  gemini: GeminiIcon,
  groq: GroqIcon,
  sumopod: SumopodIcon,
  ganrouter: GanRouterIcon,
};

const REQUIRES_BASE_URL = new Set<string>(['sumopod', 'ganrouter']);

interface AddProviderWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

type Step = 1 | 2 | 3 | 4;

export function AddProviderWizard({ open, onOpenChange, workspaceId }: AddProviderWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State
  const [step, setStep] = useState<Step>(1);
  const [providerType, setProviderType] = useState<ProviderType | ''>('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const needsBaseUrl = REQUIRES_BASE_URL.has(providerType);
  const config = providerType ? PROVIDER_REGISTRY[providerType] : null;

  function reset() {
    setStep(1);
    setProviderType('');
    setBaseUrl('');
    setApiKey('');
    setShowKey(false);
    setModel('');
    setIsDefault(false);
    setTestStatus('idle');
  }

  function handleClose(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  function handleNext() {
    if (step === 1 && needsBaseUrl) {
      setStep(2);
    } else if (step === 1) {
      setStep(3);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      // Set default model on entering step 4
      if (config && !model) setModel(config.defaultModel);
      setStep(4);
    }
  }

  function handleBack() {
    if (step === 4) setStep(3);
    else if (step === 3 && needsBaseUrl) setStep(2);
    else if (step === 3) setStep(1);
    else if (step === 2) setStep(1);
  }

  async function handleTest() {
    if (!providerType || !apiKey) return;
    setTestStatus('loading');
    try {
      const result = await testProvider(providerType, apiKey, baseUrl || undefined);
      setTestStatus(result.success ? 'success' : 'error');
    } catch {
      setTestStatus('error');
    }
  }

  function handleFinish() {
    if (!providerType || !apiKey || !config) return;
    startTransition(async () => {
      await addProvider({
        workspaceId,
        providerType,
        displayName: config.displayName,
        apiKey,
        baseUrl: baseUrl || undefined,
        model: model || config.defaultModel,
        isDefault,
      });
      handleClose(false);
      router.refresh();
    });
  }

  const canContinue =
    (step === 1 && !!providerType) ||
    (step === 2 && !!baseUrl) ||
    (step === 3 && !!apiKey) ||
    step === 4;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Add LLM Provider</DialogTitle>
          <DialogDescription>
            Step {step} of {needsBaseUrl ? 4 : 3} — {stepLabel(step, needsBaseUrl)}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="mb-4 flex gap-1.5">
          {Array.from({ length: needsBaseUrl ? 4 : 3 }, (_, i) => {
            const s = i + 1;
            const adjustedStep = !needsBaseUrl && step >= 3 ? step : step;
            const adjustedS = !needsBaseUrl && s >= 3 ? s : s;
            return (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  adjustedS <= adjustedStep ? 'bg-accent' : 'bg-bg-surface',
                )}
              />
            );
          })}
        </div>

        {/* Step 1: Select provider */}
        {step === 1 && (
          <RadioCardGroup
            value={providerType}
            onValueChange={(v) => setProviderType(v as ProviderType)}
            className="grid grid-cols-2 gap-3"
          >
            {Object.entries(PROVIDER_REGISTRY).map(([key, cfg]) => {
              const Icon = PROVIDER_ICON[key];
              return (
                <RadioCardItem key={key} value={key} className="flex items-center gap-3 p-3">
                  <div className="border-default flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border bg-bg-surface">
                    {Icon ? <Icon size={18} className="text-ink-secondary" /> : null}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-primary">{cfg.displayName}</p>
                    <p className="font-mono text-xs text-ink-tertiary">{cfg.defaultModel}</p>
                  </div>
                </RadioCardItem>
              );
            })}
          </RadioCardGroup>
        )}

        {/* Step 2: Base URL */}
        {step === 2 && (
          <div className="space-y-3">
            <label className="block font-mono text-sm text-ink-secondary">Base URL</label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              autoFocus
            />
            <p className="text-xs text-ink-tertiary">
              Required for {config?.displayName}. Enter the API endpoint URL.
            </p>
          </div>
        )}

        {/* Step 3: API Key */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="block font-mono text-sm text-ink-secondary">API Key</label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestStatus('idle');
                  }}
                  placeholder="sk-..."
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-secondary"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-ink-tertiary">
                Your key is encrypted at rest and never exposed to the client.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={!apiKey || testStatus === 'loading'}
              >
                {testStatus === 'loading' ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : testStatus === 'success' ? (
                  <Check size={14} className="text-sage mr-1.5" />
                ) : null}
                {testStatus === 'loading' ? 'Testing...' : 'Test connection'}
              </Button>
              {testStatus === 'success' && (
                <span className="text-sage font-mono text-xs">Connection successful</span>
              )}
              {testStatus === 'error' && (
                <span className="font-mono text-xs text-red-muted">Connection failed</span>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Model + Default */}
        {step === 4 && config && (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="block font-mono text-sm text-ink-secondary">Model</label>
              <Select value={model || config.defaultModel} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {config.availableModels.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked === true)}
              />
              <span className="text-sm text-ink-primary">Set as default provider</span>
            </label>
          </div>
        )}

        {/* Footer */}
        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            <div>
              {step > 1 && (
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ArrowLeft size={14} className="mr-1" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="md" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              {step < 4 ? (
                <Button
                  variant="primary-fill"
                  size="md"
                  onClick={handleNext}
                  disabled={!canContinue}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  variant="primary-fill"
                  size="md"
                  onClick={handleFinish}
                  disabled={isPending || !apiKey}
                >
                  {isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                  Finish
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function stepLabel(step: Step, needsBaseUrl: boolean): string {
  switch (step) {
    case 1:
      return 'Select provider';
    case 2:
      return 'Base URL';
    case 3:
      return 'API key';
    case 4:
      return needsBaseUrl ? 'Choose model' : 'Choose model';
  }
}
