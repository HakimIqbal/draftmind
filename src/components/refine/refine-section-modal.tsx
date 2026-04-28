'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PRD_SECTION_LABELS, type PRDSectionKey } from '@/types/prd';

type ModalState = 'idle' | 'loading' | 'result';

interface RefineSectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prdId: string;
  sectionKey: string;
  currentContent: string;
  onApply?: (refined: string) => void;
}

export function RefineSectionModal({
  open,
  onOpenChange,
  prdId,
  sectionKey,
  currentContent,
  onApply,
}: RefineSectionModalProps) {
  const [instruction, setInstruction] = useState('');
  const [state, setState] = useState<ModalState>('idle');
  const [original, setOriginal] = useState('');
  const [refined, setRefined] = useState('');

  const sectionLabel = PRD_SECTION_LABELS[sectionKey as PRDSectionKey] ?? sectionKey;

  const wordCount = instruction.trim().split(/\s+/).filter(Boolean).length;

  const reset = useCallback(() => {
    setInstruction('');
    setState('idle');
    setOriginal('');
    setRefined('');
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) reset();
      onOpenChange(next);
    },
    [onOpenChange, reset],
  );

  const handleSubmit = useCallback(async () => {
    if (!instruction.trim()) return;
    setState('loading');

    try {
      const res = await fetch('/api/prd/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdId, sectionKey, instruction }),
      });

      if (!res.ok) throw new Error('Refine request failed');

      const data = await res.json();
      setOriginal(data.original);
      setRefined(data.refined);
      setState('result');
    } catch {
      setState('idle');
    }
  }, [instruction, prdId, sectionKey]);

  const handleApply = useCallback(() => {
    onApply?.(refined);
    handleOpenChange(false);
  }, [refined, onApply, handleOpenChange]);

  const handleTryAgain = useCallback(() => {
    setState('idle');
    setOriginal('');
    setRefined('');
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Refine: {sectionLabel}</DialogTitle>
          <DialogDescription>Specify what you want to improve in this section.</DialogDescription>
        </DialogHeader>

        {state === 'idle' && (
          <>
            {/* Preview card */}
            <div className="line-clamp-3 rounded-md bg-bg-surface p-3 text-sm text-ink-secondary">
              {currentContent}
            </div>

            <Separator />

            {/* Instruction input */}
            <Textarea
              placeholder="What would you like to change?"
              rows={4}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />
            <p className="font-mono text-[11px] text-ink-tertiary">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </p>

            <DialogFooter className="items-center">
              <span className="mr-auto font-mono text-[11px] text-ink-tertiary">~6 credits</span>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button
                variant="outline"
                className="border-accent text-accent"
                disabled={!instruction.trim()}
                onClick={handleSubmit}
              >
                Refine
              </Button>
            </DialogFooter>
          </>
        )}

        {state === 'loading' && (
          <>
            <Skeleton className="h-20 w-full" />
            <p className="animate-pulse text-sm text-ink-secondary">Refining...</p>
          </>
        )}

        {state === 'result' && (
          <>
            {/* Diff preview */}
            <div className="space-y-3">
              <div>
                <p className="mb-1 font-mono text-[11px] text-ink-tertiary">Original</p>
                <p className="text-sm text-red-muted line-through">{original}</p>
              </div>
              <div>
                <p className="mb-1 font-mono text-[11px] text-ink-tertiary">Refined</p>
                <p className="whitespace-pre-wrap text-sm text-sage-muted">{refined}</p>
              </div>
            </div>

            <DialogFooter className="items-center">
              <span className="mr-auto font-mono text-[11px] text-ink-tertiary">~6 credits</span>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button variant="ghost" onClick={handleTryAgain}>
                Try again
              </Button>
              <Button variant="outline" className="border-accent text-accent" onClick={handleApply}>
                Apply
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
