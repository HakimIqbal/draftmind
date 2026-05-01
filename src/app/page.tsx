import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  PenLine,
  BarChart3,
  LayoutTemplate,
  Users,
  Kanban,
  FileOutput,
  History,
  MessageSquare,
  ChevronRight,
  FileText,
  Target,
  ListChecks,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-black/[0.05] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1140px] items-center justify-between px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo/logo.jpg"
              width={30}
              height={30}
              alt="DraftMind"
              className="rounded-lg"
            />
            <span className="font-display text-[15px] font-bold text-ink-primary">DraftMind</span>
          </Link>
          <div className="hidden items-center gap-8 sm:flex">
            <a
              href="#how-it-works"
              className="text-[13px] text-ink-tertiary transition-colors hover:text-ink-primary"
            >
              How it works
            </a>
            <a
              href="#features"
              className="text-[13px] text-ink-tertiary transition-colors hover:text-ink-primary"
            >
              Features
            </a>
          </div>
          <div className="w-[120px]" />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#fafaf9]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(200,120,60,0.07),transparent)]" />
        <div className="relative mx-auto max-w-[1140px] px-8 pb-32 pt-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
              Product Requirement Documents
            </p>
            <h1 className="font-display text-[44px] font-bold leading-[1.08] tracking-tight text-ink-primary sm:text-[56px]">
              Draft PRDs that
              <br />
              <span className="bg-gradient-to-r from-accent to-amber-600 bg-clip-text text-transparent">
                your team can ship.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-[500px] text-[16px] leading-[1.75] text-ink-secondary">
              DraftMind turns a one-line brief into a structured PRD — complete with goals, user
              stories, acceptance criteria, and success metrics. Review, refine, and approve as a
              team.
            </p>
            <div className="mt-10">
              <Link
                href={isLoggedIn ? '/dashboard' : '/login'}
                className="shadow-ink-primary/15 hover:shadow-ink-primary/20 group inline-flex h-12 items-center gap-2 rounded-xl bg-ink-primary px-7 text-[14px] font-medium text-white shadow-xl transition-all hover:shadow-2xl"
              >
                {isLoggedIn ? 'Go to Dashboard' : 'Get started'}
                {isLoggedIn ? (
                  <ArrowRight size={16} />
                ) : (
                  <ChevronRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                )}
              </Link>
            </div>
          </div>

          {/* PRD preview — shows what a generated PRD looks like */}
          <div className="relative mx-auto mt-20 max-w-3xl">
            <div className="rounded-2xl border border-black/[0.08] bg-white shadow-2xl shadow-black/[0.06]">
              {/* Header bar */}
              <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4 sm:px-8">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-ink-tertiary" />
                  <span className="text-[13px] font-medium text-ink-primary">
                    Checkout Flow Redesign
                  </span>
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-600">
                    APPROVED
                  </span>
                </div>
                <div className="hidden items-center gap-4 sm:flex">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="font-mono text-[11px] text-ink-tertiary">Health 92%</span>
                  </div>
                  <span className="font-mono text-[11px] text-ink-tertiary">v4</span>
                </div>
              </div>

              {/* PRD content skeleton */}
              <div className="grid sm:grid-cols-[1fr,220px]">
                {/* Main content */}
                <div className="space-y-6 p-6 sm:p-8">
                  {/* Section: Overview */}
                  <div>
                    <div className="flex items-center gap-2">
                      <Target size={13} className="text-accent" />
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                        Overview & Goals
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="bg-ink-primary/[0.05] h-[6px] w-full rounded-full" />
                      <div className="bg-ink-primary/[0.05] h-[6px] w-[88%] rounded-full" />
                      <div className="bg-ink-primary/[0.05] h-[6px] w-[65%] rounded-full" />
                    </div>
                  </div>
                  {/* Section: User Stories */}
                  <div>
                    <div className="flex items-center gap-2">
                      <Users size={13} className="text-accent" />
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                        User Stories
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="bg-ink-primary/[0.15] mt-1 h-1.5 w-1.5 shrink-0 rounded-full" />
                        <div className="bg-ink-primary/[0.05] h-[6px] w-[90%] rounded-full" />
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="bg-ink-primary/[0.15] mt-1 h-1.5 w-1.5 shrink-0 rounded-full" />
                        <div className="bg-ink-primary/[0.05] h-[6px] w-[75%] rounded-full" />
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="bg-ink-primary/[0.15] mt-1 h-1.5 w-1.5 shrink-0 rounded-full" />
                        <div className="bg-ink-primary/[0.05] h-[6px] w-[82%] rounded-full" />
                      </div>
                    </div>
                  </div>
                  {/* Section: Requirements */}
                  <div>
                    <div className="flex items-center gap-2">
                      <ListChecks size={13} className="text-accent" />
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                        Requirements
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="bg-ink-primary/[0.05] h-[6px] w-[95%] rounded-full" />
                      <div className="bg-ink-primary/[0.05] h-[6px] w-[70%] rounded-full" />
                    </div>
                  </div>
                  {/* Section: Success Metrics */}
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={13} className="text-accent" />
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                        Success Metrics
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="bg-ink-primary/[0.05] h-[6px] w-[80%] rounded-full" />
                      <div className="bg-ink-primary/[0.05] h-[6px] w-[60%] rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Sidebar — outline + metadata */}
                <div className="hidden border-l border-black/[0.06] p-6 sm:block">
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-widest text-ink-tertiary">
                    Sections
                  </p>
                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-accent" />
                      <span className="text-[11px] text-ink-secondary">Overview & Goals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-ink-tertiary/40 h-1 w-1 rounded-full" />
                      <span className="text-[11px] text-ink-tertiary">User Stories</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-ink-tertiary/40 h-1 w-1 rounded-full" />
                      <span className="text-[11px] text-ink-tertiary">Requirements</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-ink-tertiary/40 h-1 w-1 rounded-full" />
                      <span className="text-[11px] text-ink-tertiary">Success Metrics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-ink-tertiary/40 h-1 w-1 rounded-full" />
                      <span className="text-[11px] text-ink-tertiary">Timeline</span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 border-t border-black/[0.06] pt-4">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-ink-tertiary">
                        Owner
                      </p>
                      <p className="mt-1 text-[11px] text-ink-secondary">Muhammad Iqbal</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-ink-tertiary">
                        Updated
                      </p>
                      <p className="mt-1 text-[11px] text-ink-secondary">2 hours ago</p>
                    </div>
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-ink-tertiary">
                        Words
                      </p>
                      <p className="mt-1 text-[11px] text-ink-secondary">1,847</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Glow */}
            <div className="bg-accent/[0.06] absolute -left-20 -top-20 -z-10 h-64 w-64 rounded-full blur-[100px]" />
            <div className="bg-accent/[0.04] absolute -bottom-16 -right-16 -z-10 h-48 w-48 rounded-full blur-[80px]" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16 border-t border-black/[0.06] py-24">
        <div className="mx-auto max-w-[1140px] px-8">
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-ink-tertiary">
            How it works
          </p>
          <h2 className="mt-3 text-center font-display text-[28px] font-bold text-ink-primary">
            From brief to approved PRD
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-[14px] text-ink-secondary">
            Stop spending days writing PRDs from scratch. DraftMind automates the structure so you
            can focus on the product decisions.
          </p>

          <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
            <StepCard
              number="01"
              title="Brief it"
              description='Write one sentence — "Reduce checkout abandonment by 15%". DraftMind generates a full PRD with all standard sections.'
              icon={PenLine}
            />
            <StepCard
              number="02"
              title="Refine it"
              description="Edit any section inline. Use AI to expand, rewrite, or improve. Your team can comment and suggest changes."
              icon={Sparkles}
            />
            <StepCard
              number="03"
              title="Ship it"
              description="Run AI quality review. Move through Draft → Review → Approved. Export to PDF or share a link with stakeholders."
              icon={FileOutput}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-16 border-t border-black/[0.06] bg-[#fafaf9] py-24"
      >
        <div className="mx-auto max-w-[1140px] px-8">
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-ink-tertiary">
            Features
          </p>
          <h2 className="mt-3 text-center font-display text-[28px] font-bold text-ink-primary">
            Everything a PRD tool should have
          </h2>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Sparkles}
              title="AI Generation"
              description="One-line brief to complete PRD — goals, user stories, acceptance criteria, success metrics, and timeline."
            />
            <FeatureCard
              icon={PenLine}
              title="Rich Editor"
              description="Block-based editor with slash commands, inline AI, markdown shortcuts, and auto-save."
            />
            <FeatureCard
              icon={BarChart3}
              title="Quality Review"
              description="AI scores your PRD on completeness, clarity, consistency, and measurability. One-click fixes."
            />
            <FeatureCard
              icon={LayoutTemplate}
              title="Templates"
              description="Feature PRD, Experiment Brief, Technical RFC, Bug Report — start from proven structures."
            />
            <FeatureCard
              icon={Users}
              title="Team Collaboration"
              description="Invite your team, assign roles (Admin, Editor, Commenter, Viewer), and track changes."
            />
            <FeatureCard
              icon={Kanban}
              title="Pipeline Board"
              description="Kanban view: Draft → In Review → Refined → Final. See every PRD status at a glance."
            />
            <FeatureCard
              icon={History}
              title="Version History"
              description="Every edit is tracked. Compare versions side by side, restore any previous state."
            />
            <FeatureCard
              icon={FileOutput}
              title="Multi-format Export"
              description="Export to PDF, Markdown, HTML, DOCX, JSON, or generate a shareable public link."
            />
            <FeatureCard
              icon={MessageSquare}
              title="Inline Comments"
              description="Threaded comments on any section. Mention teammates. Resolve discussions when done."
            />
          </div>
        </div>
      </section>

      {/* Bottom */}
      <section className="border-t border-black/[0.06] py-16">
        <div className="mx-auto max-w-lg px-8 text-center">
          <Image
            src="/logo/logo.jpg"
            width={40}
            height={40}
            alt="DraftMind"
            className="mx-auto mb-4 rounded-xl"
          />
          <p className="font-display text-xl font-bold text-ink-primary">DraftMind</p>
          <p className="mt-1.5 text-[13px] text-ink-tertiary">Think Less. Draft Smarter.</p>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-black/[0.06] bg-white p-6 transition-all hover:border-black/[0.1] hover:shadow-lg hover:shadow-black/[0.04]">
      <div className="bg-accent/10 group-hover:bg-accent/15 mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-accent transition-colors">
        <Icon size={20} />
      </div>
      <h3 className="text-[14px] font-semibold text-ink-primary">{title}</h3>
      <p className="mt-2 text-[13px] leading-[1.75] text-ink-secondary">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="group rounded-2xl border border-black/[0.06] bg-white p-8 text-center transition-all hover:shadow-lg hover:shadow-black/[0.04]">
      <div className="group-hover:bg-accent/10 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fafaf9] text-accent transition-colors">
        <Icon size={24} />
      </div>
      <span className="text-accent/40 font-mono text-[11px] font-bold tracking-widest">
        {number}
      </span>
      <h3 className="mt-1.5 font-display text-[16px] font-semibold text-ink-primary">{title}</h3>
      <p className="mt-2.5 text-[13px] leading-[1.75] text-ink-secondary">{description}</p>
    </div>
  );
}
