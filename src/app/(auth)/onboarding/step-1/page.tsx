'use client';

import { useState, useTransition } from 'react';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { RadioCardGroup, RadioCardItem } from '@/components/ui/radio-card';
import { Button } from '@/components/ui/button';
import { updateStep1 } from './actions';

const ROLES = [
  'Product Manager',
  'Business Analyst',
  'Project Manager',
  'Technical Lead',
  'Engineering Manager',
  'Designer',
  'Other',
];

const EXPERIENCE_OPTIONS = [
  {
    value: 'beginner',
    title: 'Beginner',
    description: "I've read PRDs but rarely write them",
  },
  {
    value: 'intermediate',
    title: 'Intermediate',
    description: 'I write PRDs occasionally for my projects',
  },
  {
    value: 'expert',
    title: 'Expert',
    description: 'Writing PRDs is core to my workflow',
  },
];

export default function OnboardingStep1Page() {
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('');
  const [isPending, startTransition] = useTransition();

  const canSubmit = role !== '' && experience !== '';

  function handleSubmit() {
    if (!canSubmit) return;
    startTransition(() => updateStep1(role, experience));
  }

  return (
    <OnboardingShell currentStep={1}>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold">Tell us about you</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            This helps us personalize your experience
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Role select */}
          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
              What&apos;s your role?
            </label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Experience level */}
          <div className="space-y-2">
            <label className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
              How experienced are you with PRD writing?
            </label>
            <RadioCardGroup
              value={experience}
              onValueChange={setExperience}
              className="grid grid-cols-3 gap-3"
            >
              {EXPERIENCE_OPTIONS.map((opt) => (
                <RadioCardItem key={opt.value} value={opt.value} className="flex-1">
                  <p className="text-sm font-medium text-ink-primary">{opt.title}</p>
                  <p className="mt-1 text-xs text-ink-secondary">{opt.description}</p>
                </RadioCardItem>
              ))}
            </RadioCardGroup>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
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
