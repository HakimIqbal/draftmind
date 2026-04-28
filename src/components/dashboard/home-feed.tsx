'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sparkle } from '@/components/icons/sparkle';
import { HomeQuickInput } from './home-quick-input';
import { StatCard } from './stat-card';
import { ContinueWorkingCard } from './continue-working-card';
import { ActivityFeed } from './activity-feed';
import { NeedsAttentionCard } from './needs-attention-card';
import type {
  DashboardStats,
  ContinueWorkingPRD,
  ActivityFeedItem,
  NeedsAttentionItem,
} from '@/lib/db/queries/dashboard';

interface HomeFeedProps {
  userName: string;
  workspaceId: string;
  stats: DashboardStats;
  continueWorking: ContinueWorkingPRD[];
  activityFeed: ActivityFeedItem[];
  needsAttention: NeedsAttentionItem[];
}

export function HomeFeed({
  userName,
  workspaceId,
  stats,
  continueWorking,
  activityFeed,
  needsAttention,
}: HomeFeedProps) {
  const router = useRouter();
  const firstName = userName.split(' ')[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prds',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, router]);

  return (
    <div className="mx-auto max-w-5xl space-y-lg p-md">
      {/* Greeting */}
      <h1 className="font-display text-2xl font-bold">
        {greeting}, {firstName} <Sparkle size={20} />
      </h1>

      {/* Quick Input */}
      <HomeQuickInput />

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
        <StatCard label="Active PRDs" value={stats.activePRDs} />
        <StatCard label="In Queue" value={stats.queueCount} />
        <StatCard label="Avg Health" value={stats.avgHealth > 0 ? `${stats.avgHealth}%` : '--'} />
        <StatCard
          label="Cycle Time"
          value={stats.cycleTimeDays > 0 ? `${stats.cycleTimeDays}d` : '--'}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid gap-lg md:grid-cols-3">
        {/* Left column */}
        <div className="space-y-lg md:col-span-2">
          {/* Continue Working */}
          {continueWorking.length > 0 && (
            <section>
              <h2 className="mb-sm font-display text-sm font-semibold text-ink-secondary">
                Continue working
              </h2>
              <div className="grid gap-sm sm:grid-cols-2">
                {continueWorking.map((prd) => (
                  <ContinueWorkingCard key={prd.id} prd={prd} />
                ))}
              </div>
            </section>
          )}

          {/* Needs Attention */}
          {needsAttention.length > 0 && (
            <section>
              <h2 className="mb-sm font-display text-sm font-semibold text-ink-secondary">
                Needs attention
              </h2>
              <NeedsAttentionCard items={needsAttention} />
            </section>
          )}
        </div>

        {/* Right column — Activity Feed */}
        <div>
          <h2 className="mb-sm font-display text-sm font-semibold text-ink-secondary">
            Recent activity
          </h2>
          <ActivityFeed items={activityFeed} />
        </div>
      </div>
    </div>
  );
}
