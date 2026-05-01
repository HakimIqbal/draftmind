'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  FileText,
  Clock,
  BarChart3,
  Activity,
  Plus,
  ArrowRight,
  LayoutTemplate,
  Users,
} from 'lucide-react';
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
  templates?: { id: string; name: string; description: string; category: string }[];
}

export function HomeFeed({
  userName,
  workspaceId,
  stats,
  continueWorking,
  activityFeed,
  needsAttention,
  templates,
}: HomeFeedProps) {
  const router = useRouter();
  const firstName = userName.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const hasData = continueWorking.length > 0 || activityFeed.length > 0;
  const hasStats = stats.activePRDs > 0 || stats.queueCount > 0 || stats.avgHealth > 0;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prds', filter: `workspace_id=eq.${workspaceId}` },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, router]);

  // ─── Empty workspace ───
  if (!hasData && !hasStats) {
    return (
      <div className="mx-auto max-w-2xl px-8 py-16">
        <div className="text-center">
          <div className="bg-accent/10 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
            <FileText size={24} className="text-accent" />
          </div>
          <h1 className="text-[24px] font-bold text-[#1a1a1a]">
            {greeting}, {firstName}
          </h1>
          <p className="mt-2 text-[14px] text-[#888]">
            Your workspace is empty. Start by creating your first PRD.
          </p>
        </div>

        {/* Draft input */}
        <div className="mt-8 rounded-xl border border-[#eee] bg-white p-6">
          <p className="mb-3 text-[13px] font-medium text-[#1a1a1a]">Quick draft</p>
          <DraftInput />
        </div>

        {/* Actions */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <ActionCard href="/prds/new" icon={Plus} label="Blank PRD" accent />
          <ActionCard href="/templates" icon={LayoutTemplate} label="From template" />
          <ActionCard href="/workspace/members" icon={Users} label="Invite team" />
        </div>

        {/* Templates */}
        {templates && templates.length > 0 && (
          <div className="mt-10">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[#aaa]">
                Templates
              </p>
              <Link href="/templates" className="text-[12px] text-accent hover:underline">
                Browse all
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((t) => (
                <Link
                  key={t.id}
                  href={`/prds/new?template=${t.id}`}
                  className="rounded-xl border border-[#eee] bg-white p-4 transition-all hover:border-[#ddd] hover:shadow-sm"
                >
                  <span className="rounded bg-[#f5f5f4] px-1.5 py-0.5 text-[10px] font-medium text-[#888]">
                    {t.category}
                  </span>
                  <p className="mt-2 text-[13px] font-medium text-[#1a1a1a]">{t.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-[12px] text-[#999]">{t.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Active workspace ───
  return (
    <div className="mx-auto max-w-[1060px] px-8 py-8">
      {/* Greeting */}
      <h1 className="text-[24px] font-bold text-[#1a1a1a]">
        {greeting}, {firstName}
      </h1>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-4 gap-3">
        <Stat
          icon={FileText}
          label="Active PRDs"
          value={stats.activePRDs}
          bg="bg-blue-50"
          color="text-blue-600"
        />
        <Stat
          icon={Clock}
          label="In Queue"
          value={stats.queueCount}
          bg="bg-amber-50"
          color="text-amber-600"
        />
        <Stat
          icon={BarChart3}
          label="Avg Health"
          value={stats.avgHealth > 0 ? `${stats.avgHealth}%` : '--'}
          bg="bg-emerald-50"
          color="text-emerald-600"
        />
        <Stat
          icon={Activity}
          label="Cycle Time"
          value={stats.cycleTimeDays > 0 ? `${stats.cycleTimeDays}d` : '--'}
          bg="bg-violet-50"
          color="text-violet-600"
        />
      </div>

      {/* Draft */}
      <div className="mt-5 rounded-xl border border-[#eee] bg-white p-5">
        <DraftInput />
      </div>

      {/* Two column layout */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr,320px]">
        {/* Main */}
        <div className="space-y-6">
          {continueWorking.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-[#aaa]">
                  Continue working
                </p>
                <Link href="/prds" className="text-[12px] text-accent hover:underline">
                  View all
                </Link>
              </div>
              <div className="space-y-2">
                {continueWorking.map((prd) => (
                  <ContinueWorkingCard key={prd.id} prd={prd} />
                ))}
              </div>
            </section>
          )}

          {needsAttention.length > 0 && (
            <section>
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#aaa]">
                Needs attention
              </p>
              <NeedsAttentionCard items={needsAttention} />
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#aaa]">
            Activity
          </p>
          <ActivityFeed items={activityFeed} />
        </div>
      </div>
    </div>
  );
}

// ─── Components ───

function DraftInput() {
  const router = useRouter();
  const [brief, setBrief] = useState('');

  function handleDraft() {
    if (!brief.trim()) return;
    router.push(`/prds/new?brief=${encodeURIComponent(brief.trim())}`);
  }

  return (
    <div className="flex gap-2">
      <input
        className="focus:ring-accent/20 h-10 flex-1 rounded-lg border border-[#e5e5e3] bg-[#fafaf9] px-4 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:bg-white focus:outline-none focus:ring-1"
        placeholder="Describe a feature or problem to draft a PRD..."
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleDraft();
        }}
      />
      <button
        onClick={handleDraft}
        disabled={!brief.trim()}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-25"
      >
        Draft
        <ArrowRight size={13} />
      </button>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  bg,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  bg: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-[#eee] bg-white px-5 py-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
          <Icon size={15} className={color} />
        </div>
        <div>
          <p className="text-[20px] font-bold leading-none text-[#1a1a1a]">{value}</p>
          <p className="mt-1 text-[11px] text-[#999]">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  label,
  accent,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-[#eee] bg-white p-4 transition-all hover:border-[#ddd] hover:shadow-sm"
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent ? 'bg-accent/10 text-accent' : 'bg-[#f5f5f4] text-[#888]'}`}
      >
        <Icon size={15} />
      </div>
      <p className="text-[13px] font-medium text-[#1a1a1a]">{label}</p>
    </Link>
  );
}
