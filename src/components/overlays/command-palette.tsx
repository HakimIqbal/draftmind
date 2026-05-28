'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Command } from 'cmdk';
import { FileText, Search } from 'lucide-react';
import { Pill } from '@/components/ui/pill';
import { useCommandPaletteStore } from '@/stores/command-palette-store';
import { searchPRDs as searchRecent } from '@/components/overlays/command-palette-actions';
import { searchPRDs as searchContent, type SearchResult } from '@/lib/actions/search';
import { useRouter } from 'next/navigation';

interface PrdItem {
  id: string;
  title: string;
  project_tag: string | null;
  status: string;
}

export function CommandPalette() {
  const { open, setOpen } = useCommandPaletteStore();
  const [query, setQuery] = useState('');
  const [recentPrds, setRecentPrds] = useState<PrdItem[]>([]);
  const [contentResults, setContentResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (meta && key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
      if (meta && key === '.') {
        e.preventDefault();
        setOpen(false);
        router.push('/prds/new');
      }
      if (open) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setOpen(false);
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen, router]);

  // Fetch recent PRDs on open
  const fetchRecent = useCallback(async () => {
    const data = await searchRecent();
    setRecentPrds(data as PrdItem[]);
  }, []);

  useEffect(() => {
    if (open) {
      fetchRecent();
      setQuery('');
      setContentResults([]);
    }
  }, [open, fetchRecent]);

  // Debounced content search when query changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim() || query.trim().length < 2) {
      setContentResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchContent(query.trim());
        setContentResults(results);
      } catch {
        setContentResults([]);
      }
      setSearching(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function navigate(path: string) {
    setOpen(false);
    router.push(path);
  }

  if (!open) return null;

  // When user is typing a query, show content search results instead of recent PRDs
  const showContentResults = query.trim().length >= 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-0 sm:pt-[20vh]"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/30 sm:bg-black/50" />

      <div
        className="relative w-full bg-bg-elevated sm:max-w-[720px] sm:overflow-hidden sm:rounded-lg sm:border sm:border-strong sm:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command palette" shouldFilter={!showContentResults}>
          <div className="flex items-center gap-sm border-b border-subtle px-md">
            <Search size={16} className="shrink-0 text-ink-tertiary" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search PRDs by title or content..."
              className="h-11 w-full bg-transparent text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none"
              autoFocus
            />
            {searching && (
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-ink-quaternary border-t-accent" />
            )}
          </div>

          <Command.List className="max-h-[360px] overflow-y-auto p-sm">
            <Command.Empty className="px-md py-lg text-center text-sm text-ink-tertiary">
              {searching ? 'Searching...' : 'No results found.'}
            </Command.Empty>

            {/* Content search results (when typing) */}
            {showContentResults && contentResults.length > 0 && (
              <Command.Group
                heading={
                  <span className="px-sm font-mono text-[11px] uppercase text-ink-tertiary">
                    Search Results
                  </span>
                }
              >
                {contentResults.map((result) => (
                  <Command.Item
                    key={result.id}
                    value={result.title}
                    onSelect={() => navigate(`/prds/${result.id}`)}
                    className="flex cursor-pointer flex-col gap-0.5 rounded-md px-sm py-1.5 text-sm text-ink-secondary aria-selected:bg-bg-surface aria-selected:text-ink-primary data-[selected=true]:bg-bg-surface data-[selected=true]:text-ink-primary"
                  >
                    <div className="flex items-center gap-sm">
                      <FileText size={16} className="shrink-0 text-ink-tertiary" />
                      <span className="min-w-0 flex-1 truncate font-mono">{result.title}</span>
                      {result.project_tag && (
                        <span className="shrink-0 font-mono text-[11px] text-ink-tertiary">
                          {result.project_tag}
                        </span>
                      )}
                      <Pill
                        status={result.status as Parameters<typeof Pill>[0]['status']}
                        className="shrink-0"
                      />
                    </div>
                    {result.match_source === 'content' && result.content_snippet && (
                      <span className="ml-7 line-clamp-1 text-[11px] italic text-ink-tertiary">
                        {result.content_snippet}
                      </span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Recent PRDs (when not searching) */}
            {!showContentResults && recentPrds.length > 0 && (
              <Command.Group
                heading={
                  <span className="px-sm font-mono text-[11px] uppercase text-ink-tertiary">
                    Jump to
                  </span>
                }
              >
                {recentPrds.map((prd) => (
                  <Command.Item
                    key={prd.id}
                    value={`${prd.title} ${prd.project_tag ?? ''}`}
                    onSelect={() => navigate(`/prds/${prd.id}`)}
                    className="flex cursor-pointer items-center gap-sm rounded-md px-sm py-1.5 text-sm text-ink-secondary aria-selected:bg-bg-surface aria-selected:text-ink-primary data-[selected=true]:bg-bg-surface data-[selected=true]:text-ink-primary"
                  >
                    <FileText size={16} className="shrink-0 text-ink-tertiary" />
                    <span className="min-w-0 flex-1 truncate font-mono">{prd.title}</span>
                    {prd.project_tag && (
                      <span className="shrink-0 font-mono text-[11px] text-ink-tertiary">
                        {prd.project_tag}
                      </span>
                    )}
                    {prd.status && (
                      <Pill
                        status={prd.status as Parameters<typeof Pill>[0]['status']}
                        className="shrink-0"
                      />
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Actions */}
            <Command.Group
              heading={
                <span className="px-sm font-mono text-[11px] uppercase text-ink-tertiary">
                  Actions
                </span>
              }
            >
              <Command.Item
                value="Create new PRD Draft from brief"
                onSelect={() => navigate('/prds/new')}
                className="flex cursor-pointer items-center gap-sm rounded-md px-sm py-1.5 text-sm text-ink-secondary aria-selected:bg-bg-surface aria-selected:text-ink-primary data-[selected=true]:bg-bg-surface data-[selected=true]:text-ink-primary"
              >
                <FileText size={16} className="shrink-0 text-ink-tertiary" />
                <span className="flex-1">Create new PRD</span>
                <kbd className="rounded border border-subtle bg-bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-tertiary">
                  ⌘.
                </kbd>
              </Command.Item>
              <Command.Item
                value="Start from template Template PRD"
                onSelect={() => navigate('/prds/new?focus=template')}
                className="flex cursor-pointer items-center gap-sm rounded-md px-sm py-1.5 text-sm text-ink-secondary aria-selected:bg-bg-surface aria-selected:text-ink-primary data-[selected=true]:bg-bg-surface data-[selected=true]:text-ink-primary"
              >
                <FileText size={16} className="shrink-0 text-ink-tertiary" />
                <span className="flex-1">Start from template</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
