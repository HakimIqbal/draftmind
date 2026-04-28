'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioCardGroup, RadioCardItem } from '@/components/ui/radio-card';
import { Checkbox } from '@/components/ui/checkbox';
import { slugify } from '@/lib/utils/slug';
import { createWorkspace } from './actions';

/* ------------------------------------------------------------------ */
/*  Shape SVGs for workspace icon                                     */
/* ------------------------------------------------------------------ */

function CircleIcon() {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <circle cx={16} cy={16} r={12} />
    </svg>
  );
}

function SquareIcon() {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <rect x={4} y={4} width={24} height={24} />
    </svg>
  );
}

function RoundedIcon() {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <rect x={4} y={4} width={24} height={24} rx={6} />
    </svg>
  );
}

function HexagonIcon() {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <polygon points="16,2 29,9 29,23 16,30 3,23 3,9" />
    </svg>
  );
}

const iconOptions = [
  { value: 'circle', icon: <CircleIcon /> },
  { value: 'square', icon: <SquareIcon /> },
  { value: 'rounded', icon: <RoundedIcon /> },
  { value: 'hexagon', icon: <HexagonIcon /> },
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function OnboardingStep3Page() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [iconPattern, setIconPattern] = useState('circle');
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill from sessionStorage
  useEffect(() => {
    const company = sessionStorage.getItem('onboarding_company_name');
    if (company) {
      setName(company);
      setSlug(slugify(company));
    }
  }, []);

  // Auto-derive slug from name unless manually edited
  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setLoading(true);
    setError('');

    const result = await createWorkspace({
      name: name.trim(),
      slug: slug.trim(),
      icon_pattern: iconPattern,
      is_private: isPrivate,
      industry: sessionStorage.getItem('onboarding_industry'),
      team_size: sessionStorage.getItem('onboarding_team_size'),
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    sessionStorage.setItem('onboarding_workspace_id', result.workspace_id!);
    router.push('/onboarding/step-4');
  }

  return (
    <OnboardingShell currentStep={3}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold text-ink-primary">
            Create your workspace.
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            A shared space for your team&apos;s PRDs
          </p>
        </div>

        {/* Workspace name */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[11px] text-ink-tertiary">Workspace name</label>
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Acme Corp"
            required
          />
        </div>

        {/* Workspace URL slug */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[11px] text-ink-tertiary">Workspace URL</label>
          <Input
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="acme-corp"
            required
          />
          <p className="font-mono text-[11px] text-ink-tertiary">draftmind.app/w/{slug || '...'}</p>
        </div>

        {/* Workspace icon */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[11px] text-ink-tertiary">Workspace icon</label>
          <RadioCardGroup
            value={iconPattern}
            onValueChange={setIconPattern}
            className="grid grid-cols-4 gap-3"
          >
            {iconOptions.map((opt) => (
              <RadioCardItem
                key={opt.value}
                value={opt.value}
                className="flex flex-col items-center justify-center gap-1 py-3"
              >
                <span className="text-ink-secondary">{opt.icon}</span>
                <span className="font-mono text-[10px] capitalize text-ink-tertiary">
                  {opt.value}
                </span>
              </RadioCardItem>
            ))}
          </RadioCardGroup>
        </div>

        {/* Private toggle */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="private-toggle"
            checked={isPrivate}
            onCheckedChange={(checked) => setIsPrivate(checked === true)}
          />
          <label
            htmlFor="private-toggle"
            className="cursor-pointer select-none text-sm text-ink-secondary"
          >
            Make workspace private (invite-only)
          </label>
        </div>

        {/* Error */}
        {error && <p className="text-sm text-red-muted">{error}</p>}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="ghost" onClick={() => router.push('/onboarding/step-2')}>
            Back
          </Button>
          <Button type="submit" variant="outline" disabled={loading}>
            {loading ? 'Creating...' : 'Continue'}
          </Button>
        </div>
      </form>
    </OnboardingShell>
  );
}
