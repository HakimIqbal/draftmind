import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import type { ActivityFeedItem } from '@/lib/db/queries/dashboard';

const VERB_MAP: Record<string, string> = {
  prd_created: 'created a PRD',
  prd_updated: 'updated a PRD',
  prd_archived: 'archived a PRD',
  comment_added: 'commented',
  review_submitted: 'submitted a review',
  status_changed: 'changed status',
  member_invited: 'invited a member',
};

function getVerb(type: string): string {
  return VERB_MAP[type] ?? type.replace(/_/g, ' ');
}

export function ActivityFeed({ items }: { items: ActivityFeedItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[#eee] bg-white px-5 py-10 text-center">
        <p className="text-[13px] text-[#aaa]">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#eee] bg-white">
      <div className="divide-y divide-[#f5f5f5]">
        {items.map((item) => {
          const name = item.actor?.full_name ?? 'Unknown';
          return (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3">
              <Avatar name={name} size="sm" seed={item.actor?.avatar_color_seed ?? undefined} />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-[#555]">
                  <span className="font-medium text-[#1a1a1a]">{name}</span> {getVerb(item.type)}
                </p>
                <span className="text-[11px] text-[#bbb]">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
