import { createAdminClient } from '@/lib/supabase/admin';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';

export const metadata = { title: 'Admin — DraftMind' };

const VERB_MAP: Record<string, string> = {
  prd_created: 'created a PRD',
  prd_updated: 'updated a PRD',
  prd_archived: 'archived a PRD',
  prd_deleted: 'deleted a PRD',
  comment_added: 'added a comment',
  review_submitted: 'submitted a review',
  review_requested: 'requested a review',
  status_changed: 'changed PRD status',
  member_invited: 'invited a member',
  member_removed: 'removed a member',
  workspace_created: 'created a workspace',
  provider_added: 'added a provider',
  ai_run_started: 'started an AI run',
  ai_run_completed: 'completed an AI run',
};

export default async function AdminActivityPage() {
  const admin = createAdminClient();

  const { data: activities } = await admin
    .from('activity_log')
    .select('id, type, actor_id, workspace_id, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const actorIds = [...new Set((activities ?? []).map((a) => a.actor_id).filter(Boolean))];
  const { data: actors } = await admin.from('profiles').select('id, full_name').in('id', actorIds);
  const actorMap = new Map((actors ?? []).map((a) => [a.id, a]));

  const wsIds = [...new Set((activities ?? []).map((a) => a.workspace_id).filter(Boolean))];
  const { data: workspaces } = await admin.from('workspaces').select('id, name').in('id', wsIds);
  const wsMap = new Map((workspaces ?? []).map((w) => [w.id, w]));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">Activity Log</h1>
        <p className="mt-0.5 text-[13px] text-[#888]">System-wide activity feed</p>
      </div>

      <div className="rounded-xl border border-[#eee] bg-white">
        <div className="divide-y divide-[#f5f5f5]">
          {(activities ?? []).map((a) => {
            const actor = actorMap.get(a.actor_id ?? '');
            const ws = wsMap.get(a.workspace_id ?? '');
            return (
              <div
                key={a.id}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[#fafaf9]"
              >
                <Avatar name={actor?.full_name ?? 'System'} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-[#555]">
                    <span className="font-medium text-[#1a1a1a]">
                      {actor?.full_name ?? 'System'}
                    </span>{' '}
                    {VERB_MAP[a.type] ?? a.type.replace(/_/g, ' ')}
                  </p>
                  {ws && <p className="text-[11px] text-[#bbb]">{ws.name}</p>}
                </div>
                <span className="shrink-0 text-[11px] text-[#bbb]">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </span>
              </div>
            );
          })}
          {(activities ?? []).length === 0 && (
            <div className="px-5 py-16 text-center text-[13px] text-[#aaa]">
              No activity recorded yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
