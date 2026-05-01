'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';
import { pollAIRunStatus } from '@/app/(app)/prds/[prdId]/generation-actions';

interface GenerationLoadingProps {
  prdId: string;
  aiRunId: string;
  workspaceId: string;
}

const STEPS = [
  'Building structured prompt',
  'Calling AI provider',
  'Parsing JSON output',
  'Validating 14 sections',
  'Saving as draft',
] as const;

type StepStatus = 'pending' | 'current' | 'completed';

function getStepStatuses(currentStep: number): StepStatus[] {
  return STEPS.map((_, i) => {
    if (i < currentStep) return 'completed';
    if (i === currentStep) return 'current';
    return 'pending';
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function estimateTimeRemaining(elapsedMs: number, progress: number): string {
  if (progress <= 0 || progress >= 100) return '--';
  const totalEstimate = elapsedMs / (progress / 100);
  const remaining = Math.max(0, totalEstimate - elapsedMs);
  const seconds = Math.ceil(remaining / 1000);
  if (seconds < 60) return `~${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  return `~${minutes}m`;
}

export function GenerationLoading({
  prdId,
  aiRunId,
  workspaceId: _workspaceId,
}: GenerationLoadingProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const triggerRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Trigger generation on mount if status is queued
  const triggerGeneration = useCallback(async () => {
    if (triggerRef.current) return;
    triggerRef.current = true;

    try {
      const res = await fetch('/api/prd/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdId, aiRunId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Generation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    }
  }, [prdId, aiRunId]);

  // Poll ai_run status via server action
  const pollStatus = useCallback(async () => {
    const run = await pollAIRunStatus(aiRunId);

    if (run.status === 'not_found') return;

    if (run.status === 'success') {
      setCurrentStep(STEPS.length);
      setProgress(100);
      // Small delay to show completion state before redirecting
      setTimeout(() => {
        router.replace(`/prds/${prdId}`);
        router.refresh();
      }, 600);
      return;
    }

    if (run.status === 'error') {
      setError(run.error || 'Generation failed');
      return;
    }

    // Real status-based progress
    if (run.status === 'queued') {
      setCurrentStep(0);
      setProgress(10);
    } else if (run.status === 'running') {
      // AI is actively processing — show real elapsed time
      const elapsed = Date.now() - startTime;
      const elapsedSec = Math.floor(elapsed / 1000);
      // Progress based on real elapsed: cap at 90% (100% only on success)
      const realProgress = Math.min(90, 20 + elapsedSec * 3);
      setProgress(realProgress);

      // Steps based on real elapsed time during running state
      if (elapsedSec < 2)
        setCurrentStep(1); // Calling AI
      else if (elapsedSec < 5)
        setCurrentStep(2); // Parsing
      else if (elapsedSec < 8)
        setCurrentStep(3); // Validating
      else setCurrentStep(4); // Saving
    }
  }, [aiRunId, prdId, router, startTime]);

  useEffect(() => {
    triggerGeneration();
    pollRef.current = setInterval(pollStatus, 2000);
    // Run first poll immediately
    pollStatus();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [triggerGeneration, pollStatus]);

  const stepStatuses = getStepStatuses(currentStep);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-md p-lg">
        <div className="rounded-lg border border-red-200 bg-red-50 p-lg text-center dark:border-red-900 dark:bg-red-950">
          <p className="font-medium text-red-800 dark:text-red-200">Generation failed</p>
          <p className="mt-xs text-sm text-red-600 dark:text-red-400">{error}</p>
          <div className="mt-md flex justify-center gap-sm">
            <Button variant="outline" size="sm" onClick={() => router.replace(`/prds/${prdId}`)}>
              Back to PRD
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setError(null);
                triggerRef.current = false;
                setCurrentStep(0);
                setProgress(0);
                triggerGeneration();
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top progress bar */}
      <div className="border-ink-quaternary/10 flex items-center gap-sm border-b px-lg py-sm">
        <ProgressBar value={progress} className="flex-1" />
        <span className="whitespace-nowrap font-mono text-[11px] text-ink-secondary">
          {Math.round(progress)}% &middot; {Math.floor((Date.now() - startTime) / 1000)}s elapsed
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main area: Skeleton preview */}
        <div className="flex-1 overflow-y-auto p-lg">
          {/* Title skeleton */}
          <Skeleton className="mb-lg h-8 w-2/3" />

          {/* Section skeletons mimicking PRD structure */}
          {[
            { heading: 'w-1/3', lines: 3 },
            { heading: 'w-1/4', lines: 2 },
            { heading: 'w-2/5', lines: 4 },
            { heading: 'w-1/3', lines: 2 },
            { heading: 'w-1/4', lines: 3 },
            { heading: 'w-2/5', lines: 2 },
            { heading: 'w-1/3', lines: 3 },
          ].map((section, i) => (
            <div key={i} className="mb-lg">
              <Skeleton className={`h-5 ${section.heading} mb-sm`} />
              {Array.from({ length: section.lines }).map((_, j) => (
                <Skeleton
                  key={j}
                  className={`mb-xs h-3.5 ${j === section.lines - 1 ? 'w-4/5' : 'w-full'}`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Right strip: Generation steps */}
        <div className="border-ink-quaternary/10 flex w-[280px] shrink-0 flex-col border-l p-md">
          <span className="mb-md font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
            Generation Steps
          </span>

          <div className="flex flex-col gap-sm">
            {STEPS.map((step, i) => {
              const status = stepStatuses[i];
              return (
                <div key={i} className="flex items-center gap-sm">
                  {/* Status dot */}
                  <div
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      status === 'completed'
                        ? 'bg-[#6B8E5A]'
                        : status === 'current'
                          ? 'animate-pulse bg-accent'
                          : 'bg-ink-quaternary'
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      status === 'current' ? 'font-medium text-ink-primary' : 'text-ink-tertiary'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-md">
            <button
              onClick={() => {
                if (pollRef.current) clearInterval(pollRef.current);
                router.replace(`/prds/${prdId}`);
              }}
              className="text-sm text-ink-secondary transition-colors hover:text-ink-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
