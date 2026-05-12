'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { restoreVersion } from '@/app/(app)/prds/[prdId]/actions';

/* ---------- types ---------- */

interface Author {
  full_name: string;
  avatar_color_seed: string | null;
  avatar_url: string | null;
}

interface Version {
  id: string;
  version_number: number;
  source: 'manual' | 'ai_generation' | 'ai_refine' | 'restore';
  change_summary: string | null;
  created_at: string;
  author: Author | Author[] | null;
  [key: string]: unknown;
}

interface VersionHistoryPageProps {
  prd: { id: string; title: string; current_version: number | null };
  versions: Version[];
}

/* ---------- helpers ---------- */

const SOURCE_LABELS: Record<string, string> = {
  manual: 'manual',
  ai_generation: 'ai-gen',
  ai_refine: 'ai-refine',
  restore: 'restore',
};

function extractAuthor(raw: Author | Author[] | null): Author | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ---------- component ---------- */

export function VersionHistoryPage({ prd, versions }: VersionHistoryPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedVersion = versions.find((v) => v.id === selectedId) ?? null;

  return (
    <div className="flex-1 p-lg">
      {/* header */}
      <div className="mb-md">
        <p className="mb-1 font-mono text-[11px] text-ink-tertiary">
          {prd.title} / Version History
        </p>
        <h1 className="font-display text-xl font-bold text-ink-primary">Version History</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Browse and compare previous versions of this PRD.
        </p>
      </div>

      {/* two-column layout */}
      <div className="flex gap-lg">
        {/* left: timeline */}
        <div className="flex w-[320px] shrink-0 flex-col gap-1.5">
          {versions.length === 0 && (
            <p className="py-lg text-center text-sm text-ink-tertiary">No versions yet.</p>
          )}
          {versions.map((v) => {
            const author = extractAuthor(v.author);
            const isCurrent = v.version_number === prd.current_version;
            const isSelected = v.id === selectedId;

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                className={`w-full cursor-pointer rounded-md border px-3 py-2.5 text-left transition ${
                  isSelected
                    ? 'border-strong bg-bg-surface'
                    : 'border-transparent hover:border-strong hover:bg-bg-surface'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-ink-primary">v{v.version_number}</span>
                  <span className="rounded bg-bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-tertiary">
                    {SOURCE_LABELS[v.source] ?? v.source}
                  </span>
                  {isCurrent && (
                    <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] text-ink-secondary">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: '#6B8E5A' }}
                      />
                      current
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex items-center gap-1.5">
                  {author && (
                    <>
                      <Avatar
                        name={author.full_name}
                        seed={author.avatar_color_seed ?? undefined}
                        avatarUrl={author.avatar_url}
                        size="sm"
                      />
                      <span className="truncate font-mono text-[11px] text-ink-tertiary">
                        {author.full_name}
                      </span>
                    </>
                  )}
                  <span
                    className="ml-auto shrink-0 font-mono text-[11px] text-ink-tertiary"
                    suppressHydrationWarning
                  >
                    {relativeTime(v.created_at)}
                  </span>
                </div>

                {v.change_summary && (
                  <p className="mt-1 truncate text-xs text-ink-secondary">{v.change_summary}</p>
                )}
              </button>
            );
          })}
        </div>

        {/* right: diff / detail view */}
        <div className="min-w-0 flex-1">
          {!selectedVersion ? (
            <div className="flex h-full min-h-[300px] items-center justify-center">
              <p className="text-sm text-ink-tertiary">Select a version to compare</p>
            </div>
          ) : (
            <VersionDetailView version={selectedVersion} prd={prd} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- detail / diff view ---------- */

function VersionDetailView({
  version,
  prd,
}: {
  version: Version;
  prd: { id: string; current_version: number | null };
}) {
  const router = useRouter();
  const [restoring, setRestoring] = useState(false);
  const author = extractAuthor(version.author);
  const isCurrent = version.version_number === prd.current_version;

  async function handleRestore() {
    setRestoring(true);
    try {
      const result = await restoreVersion(prd.id, version.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Restored to v${version.version_number}`);
        router.refresh();
      }
    } catch {
      toast.error('Failed to restore version');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <Card>
      <CardContent className="px-md py-md">
        <div className="mb-md flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-ink-primary">
              Version {version.version_number}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded bg-bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-tertiary">
                {SOURCE_LABELS[version.source] ?? version.source}
              </span>
              <span className="font-mono text-[11px] text-ink-tertiary" suppressHydrationWarning>
                {new Date(version.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {!isCurrent && (
            <Button variant="outline" size="sm" onClick={handleRestore} disabled={restoring}>
              {restoring ? 'Restoring...' : 'Restore this version'}
            </Button>
          )}
        </div>

        {/* author */}
        {author && (
          <div className="mb-md flex items-center gap-2">
            <Avatar
              name={author.full_name}
              seed={author.avatar_color_seed ?? undefined}
              avatarUrl={author.avatar_url}
              size="md"
            />
            <span className="text-sm text-ink-secondary">{author.full_name}</span>
          </div>
        )}

        {/* change summary */}
        {version.change_summary ? (
          <div className="rounded-md border border-subtle p-3">
            <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
              Change Summary
            </p>
            <p className="whitespace-pre-wrap text-sm text-ink-secondary">
              {version.change_summary}
            </p>
          </div>
        ) : (
          <p className="text-sm text-ink-tertiary">No change summary recorded for this version.</p>
        )}

        {isCurrent && (
          <p className="mt-md flex items-center gap-1.5 font-mono text-[10px] text-ink-tertiary">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#6B8E5A' }} />
            This is the current version
          </p>
        )}
      </CardContent>
    </Card>
  );
}
