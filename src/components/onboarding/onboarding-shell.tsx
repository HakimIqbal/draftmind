'use client';

import { cn } from '@/lib/utils/cn';

interface OnboardingShellProps {
  currentStep: 1 | 2 | 3 | 4;
  children: React.ReactNode;
}

export function OnboardingShell({ currentStep, children }: OnboardingShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-canvas p-8">
      <div className="w-full max-w-[560px]">
        {/* Step indicator */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  step === currentStep
                    ? 'bg-accent'
                    : step < currentStep
                      ? 'bg-accent/40'
                      : 'border-default border bg-transparent',
                )}
              />
            ))}
          </div>
          <p className="font-mono text-[11px] text-ink-tertiary">Step {currentStep} of 4</p>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
