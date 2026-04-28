'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ProgressRing } from '@/components/ui/progress-ring';
import { ProgressBar } from '@/components/ui/progress-bar';
import { PRD_SECTION_LABELS, type PRDSectionKey } from '@/types/prd';

/* ---------- types ---------- */

interface Finding {
  id?: string;
  severity: 'high' | 'medium' | 'low';
  section_key: string;
  title: string;
  description: string;
  suggested_fix: string;
  [key: string]: unknown;
}

interface AIReviewPageProps {
  prd: Record<string, unknown>;
  findings: Array<Record<string, unknown>>;
  hasReview: boolean;
  reviewDate: string | null | undefined;
}

/* ---------- constants ---------- */

const SEVERITY_META: Record<string, { color: string; label: string }> = {
  high: { color: '#B85843', label: 'HIGH' },
  medium: { color: '#C68B3D', label: 'MED' },
  low: { color: '#7A7468', label: 'LOW' },
};

const BREAKDOWN_LABELS: Record<string, string> = {
  completeness: 'Completeness',
  clarity: 'Clarity',
  consistency: 'Consistency',
  measurability: 'Measurability',
};

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/* ---------- component ---------- */

export function AIReviewPage({
  prd,
  findings: rawFindings,
  hasReview,
  reviewDate,
}: AIReviewPageProps) {
  const router = useRouter();
  const findings = rawFindings as unknown as Finding[];
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [running, setRunning] = useState(false);

  const healthScore = (prd.health_score as number) ?? 0;
  const healthBreakdown = (prd.health_breakdown as Record<string, number> | null) ?? {};

  const filteredFindings =
    filter === 'all' ? findings : findings.filter((f) => f.severity === filter);

  const countBySeverity = (sev: string) => findings.filter((f) => f.severity === sev).length;

  async function handleRunReview() {
    setRunning(true);
    try {
      const res = await fetch('/api/prd/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdId: prd.id }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('AI review completed');
      router.refresh();
    } catch {
      toast.error('Failed to run AI review');
    } finally {
      setRunning(false);
    }
  }

  /* ---------- empty state ---------- */
  if (!hasReview) {
    return (
      <div className="flex-1 p-lg">
        <div className="mb-md">
          <p className="mb-1 font-mono text-[11px] text-ink-tertiary">
            {prd.title as string} / AI Review
          </p>
          <h1 className="font-display text-xl font-bold text-ink-primary">AI Review</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Checks completeness, clarity, and acceptance criteria.
          </p>
        </div>

        <div className="flex min-h-[400px] items-center justify-center">
          <Card className="w-full max-w-sm text-center">
            <CardContent className="flex flex-col items-center gap-4 px-md py-lg">
              <p className="text-sm text-ink-secondary">No AI review yet</p>
              <Button
                variant="outline"
                className="border-accent text-accent"
                onClick={handleRunReview}
                disabled={running}
              >
                {running ? 'Running...' : 'Run AI Review'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ---------- main review UI ---------- */
  return (
    <div className="flex-1 p-lg">
      {/* header */}
      <div className="mb-md">
        <p className="mb-1 font-mono text-[11px] text-ink-tertiary">
          {prd.title as string} / AI Review
        </p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-ink-primary">AI Review</h1>
            <p className="mt-1 text-sm text-ink-secondary">
              Checks completeness, clarity, and acceptance criteria.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRunReview} disabled={running}>
              {running ? 'Running...' : 'Rerun'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-accent text-accent"
              onClick={() => toast.info('Feature coming soon')}
            >
              Apply all fixes
            </Button>
          </div>
        </div>
        {reviewDate && (
          <p className="mt-2 font-mono text-[10px] text-ink-tertiary">
            Last reviewed{' '}
            {new Date(reviewDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>

      {/* hero score card */}
      <Card className="mb-lg">
        <CardContent className="flex items-center gap-lg px-md py-md">
          <div className="flex flex-col items-center gap-2">
            <ProgressRing size={120} value={healthScore}>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-ink-primary">{healthScore}</span>
                <span className="font-mono text-[10px] text-ink-tertiary">/ 100</span>
              </div>
            </ProgressRing>
            <span className="font-mono text-xs text-ink-secondary">
              Grade: {getGrade(healthScore)}
            </span>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-x-lg gap-y-3">
            {Object.entries(BREAKDOWN_LABELS).map(([key, label]) => {
              const val = (healthBreakdown as Record<string, number>)[key] ?? 0;
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-ink-secondary">{label}</span>
                    <span className="font-mono text-[11px] text-ink-tertiary">{val}</span>
                  </div>
                  <ProgressBar value={val} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* findings section */}
      <div>
        <div className="mb-sm flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-secondary">
            Findings &middot; {findings.length}
          </span>
          <div className="flex items-center gap-1">
            <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
              All
            </Chip>
            <Chip active={filter === 'high'} onClick={() => setFilter('high')}>
              High ({countBySeverity('high')})
            </Chip>
            <Chip active={filter === 'medium'} onClick={() => setFilter('medium')}>
              Medium ({countBySeverity('medium')})
            </Chip>
            <Chip active={filter === 'low'} onClick={() => setFilter('low')}>
              Low ({countBySeverity('low')})
            </Chip>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {filteredFindings.length === 0 && (
            <p className="py-lg text-center text-sm text-ink-tertiary">
              No findings match the selected filter.
            </p>
          )}
          {filteredFindings.map((finding, idx) => {
            const meta = SEVERITY_META[finding.severity] ?? { color: '#7A7468', label: 'LOW' };
            const sectionLabel =
              PRD_SECTION_LABELS[finding.section_key as PRDSectionKey] ?? finding.section_key;

            return (
              <Card key={finding.id ?? idx}>
                <CardContent className="flex items-start gap-3 px-4 py-3">
                  {/* severity indicator */}
                  <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                    <span className="font-mono text-[11px]" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>

                  {/* content */}
                  <div className="min-w-0 flex-1">
                    <p className="mb-0.5 font-mono text-[11px] text-ink-tertiary">
                      &sect; {sectionLabel}
                    </p>
                    <p className="text-sm font-medium text-ink-primary">{finding.title}</p>
                    {finding.suggested_fix && (
                      <p className="mt-1 line-clamp-2 text-xs text-ink-secondary">
                        {finding.suggested_fix}
                      </p>
                    )}
                  </div>

                  {/* actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-accent text-accent"
                      onClick={() => toast.info('Feature coming soon')}
                    >
                      Auto-fix
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.info('Feature coming soon')}
                    >
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
