'use client';

import { List, MessageSquare, Info, Sparkles } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/cn';

interface PanelCollapsedRailProps {
  side: 'left' | 'right';
  onExpand: (tab?: string) => void;
}

const LEFT_ITEMS = [
  { icon: List, label: 'Outline', tab: 'outline' },
  { icon: MessageSquare, label: 'Comments', tab: 'comments' },
  { icon: Info, label: 'Info', tab: 'info' },
] as const;

const RIGHT_ITEMS = [{ icon: Sparkles, label: 'AI Copilot', tab: undefined }] as const;

export function PanelCollapsedRail({ side, onExpand }: PanelCollapsedRailProps) {
  const items = side === 'left' ? LEFT_ITEMS : RIGHT_ITEMS;

  return (
    <div
      className={cn(
        'flex w-[44px] shrink-0 flex-col items-center gap-2 bg-bg-rail pt-4',
        side === 'left' ? 'border-r border-subtle' : 'border-l border-subtle',
      )}
    >
      <TooltipProvider>
        {items.map(({ icon: Icon, label, tab }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-bg-surface hover:text-ink-primary"
                onClick={() => onExpand(tab)}
              >
                <Icon size={18} />
              </button>
            </TooltipTrigger>
            <TooltipContent side={side === 'left' ? 'right' : 'left'}>{label}</TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
