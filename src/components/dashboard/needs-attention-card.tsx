'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import type { NeedsAttentionItem } from '@/lib/db/queries/dashboard';

const TYPE_LABELS: Record<string, string> = {
  review_request: 'Review',
  approval_needed: 'Approval',
  mention: 'Mention',
};

export function NeedsAttentionCard({ items }: { items: NeedsAttentionItem[] }) {
  return (
    <div className="rounded-xl border border-[#eee] bg-white">
      <div className="divide-y divide-[#f5f5f5]">
        {items.map((item) => {
          const inner = (
            <div className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-[#fafaf9]">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <AlertCircle size={14} className="text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-[#1a1a1a]">{item.title}</p>
                  <span className="rounded-md bg-[#f5f5f4] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[#999]">
                    {TYPE_LABELS[item.type] ?? item.type}
                  </span>
                </div>
                {item.body && (
                  <p className="mt-0.5 truncate text-[12px] text-[#999]">{item.body}</p>
                )}
                <p className="mt-1 text-[11px] text-[#bbb]">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );

          return item.action_url ? (
            <Link key={item.id} href={item.action_url}>
              {inner}
            </Link>
          ) : (
            <div key={item.id}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
