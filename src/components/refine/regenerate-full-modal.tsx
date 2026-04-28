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

interface RegenerateFullModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prdId: string;
  currentVersion: number;
  onRegenerate: () => void;
}

export function RegenerateFullModal({
  open,
  onOpenChange,
  prdId: _prdId,
  currentVersion,
  onRegenerate,
}: RegenerateFullModalProps) {
  const [additionalContext, setAdditionalContext] = useState('');

  const nextVersion = currentVersion + 1;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setAdditionalContext('');
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const handleRegenerate = useCallback(() => {
    onRegenerate();
    handleOpenChange(false);
  }, [onRegenerate, handleOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Regenerate full PRD</DialogTitle>
          <DialogDescription>
            This action will create a new version of the entire PRD.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-ink-secondary">
          This will create version {nextVersion} of this PRD. Current version {currentVersion} will
          remain accessible in history.
        </p>

        <Textarea
          placeholder="What's different this time? (optional)"
          rows={3}
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
        />

        <DialogFooter className="items-center">
          <span className="mr-auto font-mono text-[11px] text-ink-tertiary">~25 credits</span>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button
            variant="outline"
            className="border-red-muted text-red-muted"
            onClick={handleRegenerate}
          >
            Regenerate v{nextVersion}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
