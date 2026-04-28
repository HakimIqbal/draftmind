import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
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

interface ActivityFeedProps {
  items: ActivityFeedItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <Card className="p-sm">
        <p className="text-center text-xs text-ink-tertiary">No recent activity</p>
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-subtle p-0">
      {items.map((item) => {
        const name = item.actor?.full_name ?? 'Unknown';
        return (
          <div key={item.id} className="flex items-start gap-xs p-sm">
            <Avatar name={name} size="sm" seed={item.actor?.avatar_color_seed ?? undefined} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-primary">
                <span className="font-medium">{name}</span> {getVerb(item.type)}
              </p>
              <span className="font-mono text-[11px] text-ink-tertiary">
                {formatDistanceToNow(new Date(item.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        );
      })}
    </Card>
  );
}
