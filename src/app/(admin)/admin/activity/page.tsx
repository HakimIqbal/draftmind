import { fetchActivityLog } from './actions';
import { ActivityLogTable } from './activity-log-table';

export const metadata = { title: 'Activity Log — Admin — DraftMind' };
export const dynamic = 'force-dynamic';

export default async function AdminActivityPage() {
  const { activities, actorMap, wsMap } = await fetchActivityLog();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a1a1a]">Activity Log</h1>
        <p className="mt-0.5 text-[13px] text-[#888]">System-wide activity feed</p>
      </div>
      <ActivityLogTable
        initialActivities={activities}
        initialActorMap={actorMap}
        initialWsMap={wsMap}
      />
    </div>
  );
}
