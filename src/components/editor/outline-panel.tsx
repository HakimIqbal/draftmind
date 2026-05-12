'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import type { Editor } from '@tiptap/react';
import { useEditorStore } from '@/stores/editor-store';
import { PRD_SECTION_LABELS } from '@/types/prd';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { HealthScoreDisplay } from '@/components/editor/health-score-display';
import { CommentsPanel } from '@/components/editor/comments-panel';

// Map label text (lowercase) → section key
const LABEL_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(PRD_SECTION_LABELS).map(([k, v]) => [v.toLowerCase(), k]),
);

interface HeadingItem {
  key: string; // section key (e.g. 'overview')
  label: string; // display label (e.g. 'Overview')
  level: number; // 2 or 3
  element: Element; // DOM element for scrolling
}

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
    tiptap_content: Record<string, unknown> | null;
  };
  userId?: string;
  editorInstance?: Editor | null;
  hiddenSections?: string[];
  onToggleSection?: (sectionKey: string) => void;
  onCommentClick?: (commentId: string, range: { from: number; to: number }) => void;
}

export function OutlinePanel({
  prd,
  userId,
  editorInstance: _editorInstance,
  hiddenSections = [],
  onToggleSection,
  onCommentClick,
}: OutlinePanelProps) {
  const { activeOutlineTab, setOutlineTab, toggleOutline } = useEditorStore();
  const [activeHeading, setActiveHeading] = useState('');
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  // ── 1. Scan DOM for H2/H3 headings ──
  const activeHeadingRef = useRef(activeHeading);
  activeHeadingRef.current = activeHeading;

  const scanHeadings = useCallback(() => {
    // Try multiple selectors — ProseMirror may use either class
    const root =
      document.querySelector('.ProseMirror') ??
      document.querySelector('.tiptap-editor') ??
      document.querySelector('[contenteditable="true"]');
    if (!root) return false;

    const els = root.querySelectorAll('h1, h2, h3');
    if (els.length === 0) return false;

    const items: HeadingItem[] = [];
    let currentParentKey = '';

    els.forEach((el) => {
      const text = el.textContent?.trim() ?? '';
      if (!text || text.toUpperCase() === 'PRODUCT REQUIREMENTS DOCUMENT') return;

      // Detect level: if heading text matches a known section label → section (level 2)
      // Otherwise → sub-section (level 3)
      const isKnownSection = !!LABEL_TO_KEY[text.toLowerCase()];
      const level =
        el.tagName === 'H3'
          ? 3
          : el.tagName === 'H2'
            ? 2
            : isKnownSection
              ? 2 // H1 with known label = section heading
              : 3; // H1 with unknown label = sub-section

      if (level === 2) {
        currentParentKey = LABEL_TO_KEY[text.toLowerCase()] ?? text.toLowerCase();
        items.push({ key: currentParentKey, label: text, level, element: el });
      } else {
        items.push({ key: currentParentKey, label: text, level, element: el });
      }
    });

    if (items.length > 0) {
      setHeadings(items);
      if (!activeHeadingRef.current) {
        setActiveHeading(items[0]!.label);
      }
    }

    // Find scroll container once
    if (!scrollContainerRef.current) {
      const scrollArea = document.querySelector('.editor-scroll-area');
      if (scrollArea) scrollContainerRef.current = scrollArea as HTMLElement;
    }

    return items.length > 0;
  }, []);

  // ── 2. Scan when editor is ready + watch for changes ──
  useEffect(() => {
    if (!_editorInstance) return;

    // Editor exists — scan immediately and with retries
    const timers: ReturnType<typeof setTimeout>[] = [];
    function tryScan() {
      if (!scanHeadings()) {
        // Not found yet, retry
        timers.push(setTimeout(tryScan, 500));
      }
    }
    tryScan();

    // Re-scan on every editor update (content change)
    const onUpdate = () => setTimeout(scanHeadings, 100);
    _editorInstance.on('update', onUpdate);

    // Also periodic rescan as safety net
    const interval = setInterval(scanHeadings, 5000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
      _editorInstance.off('update', onUpdate);
    };
  }, [_editorInstance, scanHeadings]);

  // ── 3. Scroll sync: editor scroll → outline active item ──
  const outlineListRef = useRef<HTMLUListElement>(null);
  const headingsRef = useRef(headings);
  headingsRef.current = headings;
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    function getContainer(): HTMLElement | null {
      if (scrollContainerRef.current) return scrollContainerRef.current;
      const el = document.querySelector('.editor-scroll-area') as HTMLElement | null;
      if (el) scrollContainerRef.current = el;
      return el;
    }

    function handleScroll() {
      // Throttle via rAF to avoid jank
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        doSync();
      });
    }

    function doSync() {
      const container = getContainer();
      if (!container) return;

      // Query headings fresh from the DOM each time — TipTap may
      // recreate elements on edits, so cached refs go stale.
      const root =
        container.querySelector('.ProseMirror') ??
        container.querySelector('.tiptap-editor') ??
        container.querySelector('[contenteditable="true"]');
      if (!root) return;

      const headingEls = root.querySelectorAll('h1, h2, h3');
      if (headingEls.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      // Strategy: find the heading closest to the top of the visible area.
      // The "active" section is the one whose heading is nearest to (but at
      // or above) the vertical center of the scroll container.
      // Using 65% means once a heading scrolls past ~2/3 of the viewport,
      // it becomes the current section — matching what users naturally read.
      const threshold = containerRect.top + containerRect.height * 0.65;

      let current = '';

      headingEls.forEach((el) => {
        const text = el.textContent?.trim() ?? '';
        if (!text || text.toUpperCase() === 'PRODUCT REQUIREMENTS DOCUMENT') return;

        const rect = el.getBoundingClientRect();
        // Skip hidden elements
        if (rect.width === 0 && rect.height === 0) return;

        if (rect.top <= threshold) {
          current = text;
        }
      });

      if (current && current !== activeHeadingRef.current) {
        setActiveHeading(current);
        requestAnimationFrame(() => {
          const activeEl = outlineListRef.current?.querySelector('[data-active="true"]');
          if (activeEl) {
            activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        });
      }
    }

    // Attach to scroll container — retry until found
    let attached = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function tryAttach() {
      const container = getContainer();
      if (container && !attached) {
        attached = true;
        container.addEventListener('scroll', handleScroll, { passive: true });
        doSync(); // initial sync
      } else if (!attached) {
        timers.push(setTimeout(tryAttach, 500));
      }
    }
    tryAttach();

    return () => {
      timers.forEach(clearTimeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const container = scrollContainerRef.current;
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, [_editorInstance]);

  // ── 4. Click outline → scroll editor to section ──
  function scrollTo(heading: HeadingItem) {
    setActiveHeading(heading.label);
    heading.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

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
          {headings.length > 0 ? (
            <ul ref={outlineListRef} className="flex flex-col gap-0.5">
              {(() => {
                let parentHidden = false;

                return headings.map((h, i) => {
                  const isActive = activeHeading === h.label;
                  const isSection = h.level === 2; // H1/H2 = section heading
                  const isSub = h.level === 3; // H3 = sub-section

                  // Track parent hidden state
                  if (isSection) {
                    parentHidden = hiddenSections.includes(h.key);
                  }

                  // H3 inherits parent hidden state
                  const isHidden = isSection ? hiddenSections.includes(h.key) : parentHidden;

                  return (
                    <li
                      key={`${h.label}-${i}`}
                      className="group flex items-center"
                      data-active={isActive && !isHidden ? 'true' : undefined}
                    >
                      <button
                        type="button"
                        className={`relative flex min-w-0 flex-1 items-center rounded-md py-1.5 text-left text-xs transition-all ${
                          isHidden
                            ? 'text-ink-quaternary line-through'
                            : isActive
                              ? 'bg-accent/8 font-medium text-accent'
                              : 'hover:bg-bg-elevated/50 text-ink-secondary hover:text-ink-primary'
                        }`}
                        style={{ paddingLeft: isSub ? '28px' : '12px' }}
                        onClick={() => {
                          if (!isHidden) scrollTo(h);
                        }}
                      >
                        {isActive && !isHidden && (
                          <span className="absolute bottom-1 left-0 top-1 w-[3px] rounded-full bg-accent" />
                        )}
                        <span className={`truncate ${isSub ? 'text-[11px]' : ''}`}>{h.label}</span>
                      </button>
                      {isSection && (
                        <button
                          type="button"
                          onClick={() => onToggleSection?.(h.key)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-ink-quaternary opacity-0 transition-all hover:bg-bg-elevated hover:text-ink-secondary group-hover:opacity-100"
                          title={isHidden ? 'Show section' : 'Hide section'}
                        >
                          {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      )}
                    </li>
                  );
                });
              })()}
            </ul>
          ) : (
            <p className="py-8 text-center text-xs text-ink-tertiary">Loading outline...</p>
          )}
        </TabsContent>

        {/* Comments tab */}
        <TabsContent value="comments" className="flex-1 overflow-y-auto">
          {userId ? (
            <CommentsPanel prdId={prd.id} currentUserId={userId} onCommentClick={onCommentClick} />
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
              <dd className="text-ink-primary" suppressHydrationWarning>
                {prd.word_count.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-ink-tertiary">Last Updated</dt>
              <dd className="text-ink-primary" suppressHydrationWarning>
                {new Date(prd.updated_at).toLocaleDateString()}
              </dd>
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
              <span className="font-bold text-ink-primary" suppressHydrationWarning>
                {prd.word_count.toLocaleString()}
              </span>
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
