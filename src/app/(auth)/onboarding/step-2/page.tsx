'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { updateStep2 } from './actions';

const TEAM_SIZES = ['Just me', '2-10', '11-50', '51-200', '200+'];

const USE_CASES = [
  'Feature PRD',
  'RFC',
  'Experiment Brief',
  'One-pager',
  'Research Brief',
  'Custom',
];

const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'E-commerce',
  'Education',
  'Media',
  'Other',
];

export default function OnboardingStep2Page() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [industry, setIndustry] = useState('');
  const [isPending, startTransition] = useTransition();

  const canSubmit = selectedUseCases.length > 0;

  const toggleUseCase = useCallback((useCase: string) => {
    setSelectedUseCases((prev) =>
      prev.includes(useCase) ? prev.filter((c) => c !== useCase) : [...prev, useCase],
    );
  }, []);

  function handleSubmit() {
    if (!canSubmit) return;

    // Store company/team info in sessionStorage for step 3 workspace creation
    if (companyName) sessionStorage.setItem('onboarding_company_name', companyName);
    if (teamSize) sessionStorage.setItem('onboarding_team_size', teamSize);
    if (industry) sessionStorage.setItem('onboarding_industry', industry);

    startTransition(() => updateStep2(selectedUseCases));
  }

  return (
    <OnboardingShell currentStep={2}>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold">Where do you work?</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            We&apos;ll use this to set up your workspace
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Company name */}
          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
              Company name
            </label>
            <Input
              placeholder="Algo Network"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          {/* Team size */}
          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
              Team size
            </label>
            <Select value={teamSize} onValueChange={setTeamSize}>
              <SelectTrigger>
                <SelectValue placeholder="Select team size" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Primary use cases */}
          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
              Primary use cases
            </label>
            <div className="flex flex-wrap gap-2">
              {USE_CASES.map((useCase) => (
                <Chip
                  key={useCase}
                  active={selectedUseCases.includes(useCase)}
                  onClick={() => toggleUseCase(useCase)}
                >
                  {useCase}
                </Chip>
              ))}
            </div>
          </div>

          {/* Industry (optional) */}
          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
              Industry{' '}
              <span className="text-ink-tertiary/60 normal-case tracking-normal">(optional)</span>
            </label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => router.push('/onboarding/step-1')}>
            Back
          </Button>
          <Button
            variant="outline"
            className="hover:bg-accent/10 border-accent text-accent"
            disabled={!canSubmit || isPending}
            onClick={handleSubmit}
          >
            {isPending ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </OnboardingShell>
  );
}
