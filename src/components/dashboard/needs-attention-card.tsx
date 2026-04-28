'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '@/components/ui/card';
import type { NeedsAttentionItem } from '@/lib/db/queries/dashboard';

const TYPE_LABELS: Record<string, string> = {
  review_request: 'Review',
  approval_needed: 'Approval',
  mention: 'Mention',
};

interface NeedsAttentionCardProps {
  items: NeedsAttentionItem[];
}

export function NeedsAttentionCard({ items }: NeedsAttentionCardProps) {
  return (
    <div className="flex gap-sm overflow-x-auto pb-xs">
      {items.map((item) => {
        const content = (
          <Card className="flex h-full flex-col gap-xs p-sm transition-colors hover:border-strong">
            <div className="flex items-center gap-xs">
              <span className="rounded-sm border border-subtle px-1.5 py-0.5 font-mono text-[10px] uppercase text-ink-tertiary">
                {TYPE_LABELS[item.type] ?? item.type}
              </span>
              <span className="font-mono text-[11px] text-ink-tertiary">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </span>
            </div>
            <span className="text-sm font-medium text-ink-primary">{item.title}</span>
            {item.body && <p className="truncate text-xs text-ink-secondary">{item.body}</p>}
          </Card>
        );

        return item.action_url ? (
          <Link
            key={item.id}
            href={item.action_url}
            className="min-w-[200px] max-w-[260px] shrink-0"
          >
            {content}
          </Link>
        ) : (
          <div key={item.id} className="min-w-[200px] max-w-[260px] shrink-0">
            {content}
          </div>
        );
      })}
    </div>
  );
}
