'use client';

import { ProgressRing } from '@/components/ui/progress-ring';
import { ProgressBar } from '@/components/ui/progress-bar';

interface HealthScoreDisplayProps {
  score: number | null;
  breakdown: Record<string, number> | null;
}

const BREAKDOWN_LABELS: Record<string, string> = {
  completeness: 'Completeness',
  specificity: 'Specificity',
  structural: 'Structural',
  consistency: 'Consistency',
};

function getGrade(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good shape';
  if (score >= 50) return 'Needs work';
  return 'Poor';
}

export function HealthScoreDisplay({ score, breakdown }: HealthScoreDisplayProps) {
  const displayScore = score ?? 0;

  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center gap-1">
        <ProgressRing size={64} value={displayScore}>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-ink-primary">{displayScore}</span>
            <span className="font-mono text-[10px] text-ink-tertiary">/100</span>
          </div>
        </ProgressRing>
        <span className="font-mono text-[11px] text-ink-tertiary">
          {score !== null ? getGrade(displayScore) : 'N/A'}
        </span>
      </div>

      {breakdown && (
        <div className="flex flex-1 flex-col gap-2.5 pt-1">
          {Object.entries(BREAKDOWN_LABELS).map(([key, label]) => (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-ink-tertiary">{label}</span>
                <span className="font-mono text-[10px] text-ink-secondary">
                  {breakdown[key] ?? 0}
                </span>
              </div>
              <ProgressBar value={breakdown[key] ?? 0} className="w-[60px]" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
