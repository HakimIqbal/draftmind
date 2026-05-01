'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';
import { PRD_SECTION_KEYS, PRD_SECTION_LABELS } from '@/types/prd';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { HealthScoreDisplay } from '@/components/editor/health-score-display';
import { CommentsPanel } from '@/components/editor/comments-panel';

interface OutlinePanelProps {
  prd: {
    id: string;
    title: string;
    status: string;
    current_version: number;
    word_count: number;
    read_time_minutes: number;
    health_score: number | null;
    health_breakdown: Record<string, number> | null;
    updated_at: string;
  };
  userId?: string;
}

export function OutlinePanel({ prd, userId }: OutlinePanelProps) {
  const { activeOutlineTab, setOutlineTab, toggleOutline } = useEditorStore();
  const [activeSection, setActiveSection] = useState<string>(PRD_SECTION_KEYS[0]);

  const tabLabel =
    activeOutlineTab === 'outline'
      ? 'Outline'
      : activeOutlineTab === 'comments'
        ? 'Comments'
        : 'Info';

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r border-subtle bg-bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-mono text-xs font-medium text-ink-primary">{tabLabel}</span>
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-bg-elevated hover:text-ink-primary"
          onClick={toggleOutline}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeOutlineTab}
        onValueChange={(v) => setOutlineTab(v as 'outline' | 'comments' | 'info')}
      >
        <TabsList className="px-4">
          <TabsTrigger value="outline" className="text-xs">
            Outline
          </TabsTrigger>
          <TabsTrigger value="comments" className="text-xs">
            Comments
          </TabsTrigger>
          <TabsTrigger value="info" className="text-xs">
            Info
          </TabsTrigger>
        </TabsList>

        {/* Outline tab */}
        <TabsContent value="outline" className="flex-1 overflow-y-auto px-4">
          <ul className="flex flex-col gap-1">
            {PRD_SECTION_KEYS.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                    activeSection === key
                      ? 'bg-bg-elevated text-ink-primary'
                      : 'hover:bg-bg-elevated/50 text-ink-secondary hover:text-ink-primary'
                  }`}
                  onClick={() => setActiveSection(key)}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-tertiary" />
                  {PRD_SECTION_LABELS[key]}
                </button>
              </li>
            ))}
          </ul>
        </TabsContent>

        {/* Comments tab */}
        <TabsContent value="comments" className="flex-1 overflow-y-auto">
          {userId ? (
            <CommentsPanel prdId={prd.id} currentUserId={userId} />
          ) : (
            <div className="flex h-32 items-center justify-center px-4">
              <span className="text-sm text-ink-tertiary">Sign in to comment</span>
            </div>
          )}
        </TabsContent>

        {/* Info tab */}
        <TabsContent value="info" className="flex-1 overflow-y-auto px-4">
          <dl className="flex flex-col gap-3 text-xs">
            <div>
              <dt className="font-mono text-[10px] uppercase text-ink-tertiary">Title</dt>
              <dd className="text-ink-primary">{prd.title}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-ink-tertiary">Status</dt>
              <dd className="capitalize text-ink-primary">{prd.status.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-ink-tertiary">Version</dt>
              <dd className="text-ink-primary">v{prd.current_version}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-ink-tertiary">Word Count</dt>
              <dd className="text-ink-primary">{prd.word_count.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-ink-tertiary">Last Updated</dt>
              <dd className="text-ink-primary">{new Date(prd.updated_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </TabsContent>
      </Tabs>

      {/* Bottom stats card */}
      <div className="mt-auto">
        <Separator />
        <div className="flex flex-col gap-3 p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-tertiary">
            Draft Stats
          </span>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-ink-tertiary">Words</span>
              <span className="font-bold text-ink-primary">{prd.word_count.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-ink-tertiary">Read time</span>
              <span className="font-bold text-ink-primary">{prd.read_time_minutes}m</span>
            </div>
          </div>
          <HealthScoreDisplay score={prd.health_score} breakdown={prd.health_breakdown} />
        </div>
      </div>
    </div>
  );
}
