'use client';

import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Template } from '@/app/(app)/templates/page';

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter();

  function handleUse() {
    router.push(`/prds/new?template=${template.id}`);
  }

  return (
    <Card className="flex flex-col justify-between border-subtle bg-bg-surface transition-colors hover:border-strong">
      <div className="space-y-2">
        {/* Icon + Title */}
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-ink-tertiary" />
          <h3 className="text-sm font-medium leading-tight text-ink-primary">{template.name}</h3>
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
        <Button variant="outline" size="sm" onClick={handleUse}>
          Use
        </Button>
      </div>
    </Card>
  );
}
