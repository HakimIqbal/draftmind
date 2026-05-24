'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { deleteTemplate } from '@/app/(app)/templates/actions';
import type { Template } from '@/app/(app)/templates/page';

interface TemplateCardProps {
  template: Template;
  onEdit?: () => void;
  canManage?: boolean;
}

export function TemplateCard({ template, onEdit, canManage = false }: TemplateCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isNavigating, startNavigation] = useTransition();
  const isCustom = !template.is_built_in;

  useEffect(() => {
    router.prefetch(`/prds/new?template=${template.id}&focus=template`);
  }, [router, template.id]);

  function handleUse() {
    toast.info('Opening template...');
    startNavigation(() => {
      router.push(`/prds/new?template=${template.id}&focus=template`);
    });
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const result = await deleteTemplate(template.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Template deleted');
      }
    } catch {
      toast.error('Failed to delete template');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="flex flex-col justify-between border-subtle bg-bg-surface transition-colors hover:border-strong">
      <div className="space-y-2">
        {/* Icon + Title */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-ink-tertiary" />
            <h3 className="text-sm font-medium leading-tight text-ink-primary">{template.name}</h3>
          </div>
          {isCustom && canManage && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded p-1 text-ink-tertiary transition-colors hover:bg-bg-elevated hover:text-ink-primary"
                >
                  <Pencil size={12} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="rounded p-1 text-ink-tertiary transition-colors hover:bg-bg-elevated hover:text-red-muted"
              >
                <Trash2 size={12} />
              </button>
              <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle>Delete template</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete &quot;{template.name}&quot;? This action
                      cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-muted text-red-muted"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Description */}
        {template.description && (
          <p className="line-clamp-2 text-xs text-ink-secondary">{template.description}</p>
        )}

        {/* Category badge */}
        <span className="inline-block font-mono text-[10px] text-ink-tertiary">
          {template.category}
        </span>
      </div>

      {/* Bottom row */}
      <div className="mt-4 flex items-center justify-between border-t border-subtle pt-3">
        <span className="font-mono text-[11px] text-ink-tertiary">
          {template.use_count} {template.use_count === 1 ? 'use' : 'uses'}
        </span>
        <Button variant="outline" size="sm" onClick={handleUse} disabled={isNavigating}>
          {isNavigating ? 'Opening...' : 'Use'}
        </Button>
      </div>
    </Card>
  );
}
