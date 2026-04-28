'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { createPRDAndGenerate } from '@/app/(app)/prds/new/actions';

interface GenerateFormProps {
  userId: string;
  workspaceId: string;
  userName: string;
  initialBrief: string;
}

export function GenerateForm({ userId, workspaceId, userName, initialBrief }: GenerateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState('');
  const [projectTag, setProjectTag] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [brief, setBrief] = useState(initialBrief);
  const [error, setError] = useState('');

  const wordCount = brief.trim().split(/\s+/).filter(Boolean).length;

  function handleSubmit() {
    setError('');

    if (!title.trim()) {
      setError('Project name is required.');
      return;
    }

    if (wordCount < 50) {
      setError('Brief is too short. Minimum 50 words required.');
      return;
    }

    startTransition(async () => {
      try {
        await createPRDAndGenerate({
          workspaceId,
          userId,
          title: title.trim(),
          projectTag: projectTag.trim() || undefined,
          brief: brief.trim(),
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });
  }

  return (
    <div className="pb-24">
      {/* Breadcrumb */}
      <p className="font-mono text-[11px] text-ink-tertiary">My PRDs / New PRD</p>

      {/* Title */}
      <h1 className="mt-sm font-display text-xl font-bold text-ink-primary">Create new PRD</h1>

      <Separator className="my-md" />

      {/* Tabs */}
      <Tabs defaultValue="scratch">
        <TabsList>
          <TabsTrigger value="scratch">From scratch</TabsTrigger>
          <TabsTrigger value="template">From template</TabsTrigger>
        </TabsList>

        <TabsContent value="scratch">
          <div className="flex flex-col gap-md">
            {/* Section 1 — Project metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Project metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mt-md flex flex-col gap-md">
                  {/* Project name */}
                  <div className="flex flex-col gap-xs">
                    <label className="font-mono text-[11px] uppercase text-ink-tertiary">
                      Project name
                    </label>
                    <Input
                      placeholder="e.g. Wallet Redesign Q2"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Owner */}
                  <div className="flex flex-col gap-xs">
                    <label className="font-mono text-[11px] uppercase text-ink-tertiary">
                      Owner
                    </label>
                    <Input value={userName} readOnly className="opacity-60" />
                  </div>

                  {/* Project tag */}
                  <div className="flex flex-col gap-xs">
                    <label className="font-mono text-[11px] uppercase text-ink-tertiary">
                      Project tag <span className="normal-case text-ink-tertiary">(optional)</span>
                    </label>
                    <Input
                      placeholder="e.g. Q2 2026 Growth"
                      value={projectTag}
                      onChange={(e) => setProjectTag(e.target.value)}
                    />
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-md">
                    <div className="flex flex-col gap-xs">
                      <label className="font-mono text-[11px] uppercase text-ink-tertiary">
                        Start date <span className="normal-case text-ink-tertiary">(optional)</span>
                      </label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="font-mono text-[11px] uppercase text-ink-tertiary">
                        End date <span className="normal-case text-ink-tertiary">(optional)</span>
                      </label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2 — Brief / context */}
            <Card>
              <CardHeader>
                <CardTitle>Brief / context</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mt-md flex flex-col gap-sm">
                  <label className="font-mono text-[11px] uppercase text-ink-tertiary">
                    Tell us about what we&apos;re building
                  </label>
                  <Textarea
                    rows={8}
                    placeholder="Describe the product, feature, or problem you want to solve. Include any context, constraints, or goals..."
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                  />
                  <div className="flex flex-col gap-xs">
                    <p className="font-mono text-[11px] text-ink-tertiary">
                      Tip: minimum 200 words for best results · Currently: {wordCount} words
                    </p>
                    {wordCount < 50 && wordCount > 0 && (
                      <p className="font-mono text-[11px] text-amber-500">
                        Brief is too short. Minimum 50 words required.
                      </p>
                    )}
                    {wordCount >= 50 && wordCount < 200 && (
                      <p className="font-mono text-[11px] text-ink-tertiary">
                        Brief is short. 200+ words recommended for better results.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="template">
          <Card>
            <CardContent className="py-lg text-center">
              <p className="text-sm text-ink-secondary">Coming in Phase 4</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error */}
      {error && <p className="mt-md font-mono text-[11px] text-red-muted">{error}</p>}

      {/* Sticky footer */}
      <div className="bg-bg-base fixed inset-x-0 bottom-0 z-50 border-t border-subtle">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-lg py-sm">
          <span className="font-mono text-[11px] text-ink-tertiary">~25 credits</span>
          <div className="flex items-center gap-sm">
            <Button variant="ghost" onClick={() => router.push('/prds')}>
              Cancel
            </Button>
            <Button variant="primary-fill" onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Creating...' : 'Generate PRD'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
