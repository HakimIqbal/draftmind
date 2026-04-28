'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioCardGroup, RadioCardItem } from '@/components/ui/radio-card';
import { Separator } from '@/components/ui/separator';
import { testProvider, finalizeOnboarding } from './actions';

/* ------------------------------------------------------------------ */
/*  AI Providers                                                      */
/* ------------------------------------------------------------------ */

const providers = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'groq', label: 'Groq' },
  { value: 'sumopod', label: 'Sumopod' },
  { value: 'ganrouter', label: 'GaNRouter' },
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function OnboardingStep4Page() {
  const router = useRouter();

  // AI provider state
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    model?: string;
    error?: string;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  // Invite state
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);

  // Submit state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleTestKey() {
    if (!selectedProvider || !apiKey) return;
    setTesting(true);
    setTestResult(null);

    const result = await testProvider({
      type: selectedProvider,
      apiKey,
    });

    setTestResult(result);
    setTesting(false);
  }

  function handleAddEmail() {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    if (emails.includes(trimmed)) return;
    setEmails((prev) => [...prev, trimmed]);
    setEmailInput('');
  }

  function handleRemoveEmail(email: string) {
    setEmails((prev) => prev.filter((e) => e !== email));
  }

  function handleEmailKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const workspaceId = sessionStorage.getItem('onboarding_workspace_id');
    if (!workspaceId) {
      setError('Workspace not found. Please go back and create a workspace first.');
      setLoading(false);
      return;
    }

    const result = await finalizeOnboarding({
      workspace_id: workspaceId,
      provider_type: selectedProvider,
      provider_api_key: selectedProvider && apiKey ? apiKey : null,
      invite_emails: emails,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Clear onboarding sessionStorage
    sessionStorage.removeItem('onboarding_company');
    sessionStorage.removeItem('onboarding_industry');
    sessionStorage.removeItem('onboarding_team_size');
    sessionStorage.removeItem('onboarding_workspace_id');

    router.push('/home');
  }

  return (
    <OnboardingShell currentStep={4}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold text-ink-primary">Almost there!</h1>
          <p className="mt-1 text-sm text-ink-secondary">Configure AI and invite your team</p>
        </div>

        {/* -------------------------------------------------------- */}
        {/*  AI Provider Section                                     */}
        {/* -------------------------------------------------------- */}
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-medium text-ink-primary">Configure your AI provider</h2>
            <p className="text-xs text-ink-tertiary">
              You can add more providers later in Settings
            </p>
          </div>

          <RadioCardGroup
            value={selectedProvider ?? undefined}
            onValueChange={setSelectedProvider}
            className="grid grid-cols-3 gap-3"
          >
            {providers.map((p) => (
              <RadioCardItem
                key={p.value}
                value={p.value}
                className="flex items-center justify-center py-3"
              >
                <span className="font-mono text-sm text-ink-primary">{p.label}</span>
              </RadioCardItem>
            ))}
          </RadioCardGroup>

          {/* API key input (shown when provider selected) */}
          {selectedProvider && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Paste your API key"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestResult(null);
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestKey}
                  disabled={testing || !apiKey}
                >
                  {testing ? 'Testing...' : 'Test API key'}
                </Button>
              </div>

              {testResult && (
                <p className={`text-xs ${testResult.ok ? 'text-green-500' : 'text-red-muted'}`}>
                  {testResult.ok
                    ? `Connected! Model: ${testResult.model}`
                    : testResult.error || 'Connection failed'}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            className="self-start text-xs text-ink-tertiary underline underline-offset-2 hover:text-ink-secondary"
            onClick={() => {
              setSelectedProvider(null);
              setApiKey('');
              setTestResult(null);
            }}
          >
            Skip for now
          </button>
        </div>

        {/* -------------------------------------------------------- */}
        {/*  Invite Team Section                                     */}
        {/* -------------------------------------------------------- */}
        <Separator />

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-ink-primary">Invite your team</h2>

          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddEmail}>
              Add
            </Button>
          </div>

          {/* Email chips */}
          {emails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {emails.map((email) => (
                <span
                  key={email}
                  className="border-default inline-flex items-center gap-1 rounded-md border bg-bg-surface px-2 py-1 font-mono text-xs text-ink-secondary"
                >
                  {email}
                  <button
                    type="button"
                    className="ml-0.5 text-ink-tertiary hover:text-ink-primary"
                    onClick={() => handleRemoveEmail(email)}
                    aria-label={`Remove ${email}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            className="self-start text-xs text-ink-tertiary underline underline-offset-2 hover:text-ink-secondary"
            onClick={() => setEmails([])}
          >
            Skip
          </button>
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-muted">{error}</p>}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" onClick={() => router.push('/onboarding/step-3')}>
            Back
          </Button>
          <Button type="submit" variant="outline" disabled={loading}>
            {loading ? 'Finishing...' : 'Finish setup'}
          </Button>
        </div>
      </form>
    </OnboardingShell>
  );
}
