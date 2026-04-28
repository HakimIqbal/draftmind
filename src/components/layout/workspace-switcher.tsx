'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, Plus, Check } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { setCurrentWorkspace } from '@/app/(app)/actions';
import type { WorkspaceListItem } from '@/lib/db/queries/workspace';

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceListItem[];
  currentWorkspaceId: string;
}

export function WorkspaceSwitcher({ workspaces, currentWorkspaceId }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const current = workspaces.find((w) => w.id === currentWorkspaceId) ?? workspaces[0];

  function handleSwitch(wsId: string) {
    if (wsId === currentWorkspaceId) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await setCurrentWorkspace(wsId);
      setOpen(false);
    });
  }

  if (!current) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-xs text-left" disabled={isPending}>
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-[11px] font-bold text-white">
            {current.name[0]}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-primary">{current.name}</p>
          </div>
          <ChevronDown size={14} className="shrink-0 text-ink-tertiary" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="p-md">
          <h4 className="mb-sm font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
            Your Workspaces
          </h4>
          <ul className="space-y-xs">
            {workspaces.map((ws) => (
              <li key={ws.id}>
                <button
                  className="flex w-full items-center gap-sm rounded-md px-sm py-xs text-left transition-colors hover:bg-bg-surface"
                  onClick={() => handleSwitch(ws.id)}
                  disabled={isPending}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
                    {ws.name[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink-primary">{ws.name}</p>
                    <p className="font-mono text-[11px] text-ink-tertiary">{ws.role}</p>
                  </div>
                  {ws.id === currentWorkspaceId && (
                    <Check size={14} className="shrink-0 text-accent" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <Separator />
        <div className="flex items-center justify-between p-md">
          <button className="flex items-center gap-xs text-sm text-ink-secondary transition-colors hover:text-ink-primary">
            <Plus size={14} />
            Create workspace
          </button>
          <button className="text-sm text-ink-tertiary underline-offset-4 transition-colors hover:text-ink-primary hover:underline">
            Manage
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
