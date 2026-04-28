'use client';

import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { FileText, LayoutTemplate, Sun, Moon, Settings, Search } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';
import { Pill } from '@/components/ui/pill';
import { useCommandPaletteStore } from '@/stores/command-palette-store';
import { createClient } from '@/lib/supabase/client';
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
  const [prds, setPrds] = useState<PrdItem[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const router = useRouter();

  // Global keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  // Fetch recent PRDs on mount
  const fetchPrds = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('prds')
      .select('id, title, project_tag, status')
      .order('updated_at', { ascending: false })
      .limit(20);
    if (data) setPrds(data);
  }, []);

  useEffect(() => {
    if (open) {
      fetchPrds();
      setQuery('');
    }
  }, [open, fetchPrds]);

  // Detect current theme
  useEffect(() => {
    const html = document.documentElement;
    setTheme(html.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  }, [open]);

  function navigate(path: string) {
    setOpen(false);
    router.push(path);
  }

  function toggleTheme() {
    const html = document.documentElement;
    const next = theme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    setTheme(next);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={() => setOpen(false)}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Command container */}
      <div
        className="relative w-full max-w-[720px] overflow-hidden rounded-lg border border-strong bg-bg-elevated shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command palette" shouldFilter={true}>
          {/* Input */}
          <div className="flex items-center gap-sm border-b border-subtle px-md">
            <Search size={16} className="shrink-0 text-ink-tertiary" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search PRDs, run commands, or ask AI..."
              className="h-11 w-full bg-transparent text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none"
            />
          </div>

          <Command.List className="max-h-[360px] overflow-y-auto p-sm">
            <Command.Empty className="px-md py-lg text-center text-sm text-ink-tertiary">
              No results found.
            </Command.Empty>

            {/* Jump to PRDs */}
            {prds.length > 0 && (
              <Command.Group
                heading={
                  <span className="px-sm font-mono text-[11px] uppercase text-ink-tertiary">
                    Jump to
                  </span>
                }
              >
                {prds.map((prd) => (
                  <Command.Item
                    key={prd.id}
                    value={`${prd.title} ${prd.project_tag ?? ''}`}
                    onSelect={() => navigate(`/prds/${prd.id}`)}
                    className="flex cursor-pointer items-center gap-sm rounded-md px-sm py-1.5 text-sm text-ink-secondary aria-selected:bg-bg-surface aria-selected:text-ink-primary"
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
                value="Create new PRD"
                onSelect={() => navigate('/prds/new')}
                className="flex cursor-pointer items-center gap-sm rounded-md px-sm py-1.5 text-sm text-ink-secondary aria-selected:bg-bg-surface aria-selected:text-ink-primary"
              >
                <FileText size={16} className="shrink-0 text-ink-tertiary" />
                <span className="flex-1">Create new PRD</span>
                <Kbd>&#8984;N</Kbd>
              </Command.Item>

              <Command.Item
                value="Start from template"
                onSelect={() => navigate('/prds/new?template=true')}
                className="flex cursor-pointer items-center gap-sm rounded-md px-sm py-1.5 text-sm text-ink-secondary aria-selected:bg-bg-surface aria-selected:text-ink-primary"
              >
                <LayoutTemplate size={16} className="shrink-0 text-ink-tertiary" />
                <span className="flex-1">Start from template</span>
                <Kbd>&#8984;T</Kbd>
              </Command.Item>

              <Command.Item
                value="Toggle theme"
                onSelect={toggleTheme}
                className="flex cursor-pointer items-center gap-sm rounded-md px-sm py-1.5 text-sm text-ink-secondary aria-selected:bg-bg-surface aria-selected:text-ink-primary"
              >
                {theme === 'dark' ? (
                  <Sun size={16} className="shrink-0 text-ink-tertiary" />
                ) : (
                  <Moon size={16} className="shrink-0 text-ink-tertiary" />
                )}
                <span className="flex-1">Toggle theme</span>
              </Command.Item>

              <Command.Item
                value="Open settings"
                onSelect={() => navigate('/settings')}
                className="flex cursor-pointer items-center gap-sm rounded-md px-sm py-1.5 text-sm text-ink-secondary aria-selected:bg-bg-surface aria-selected:text-ink-primary"
              >
                <Settings size={16} className="shrink-0 text-ink-tertiary" />
                <span className="flex-1">Open settings</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="flex items-center gap-md border-t border-subtle px-md py-sm">
            <span className="font-mono text-[11px] text-ink-tertiary">
              &#8593;&#8595; navigate &middot; &#8629; select &middot; esc close
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}
