import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, PenLine, FileOutput, ChevronRight } from 'lucide-react';
import { PRD_SECTION_KEYS } from '@/types/prd';
import { FeatureShowcase } from '@/components/landing/feature-showcase';
import { LandingStats } from '@/components/landing/landing-stats';
import { createClient } from '@/lib/supabase/server';

const EXPORT_FORMATS = ['PDF', 'Word', 'HTML', 'Markdown', 'Slack', 'Jira'] as const;

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const sectionCount = PRD_SECTION_KEYS.length;
  const exportCount = EXPORT_FORMATS.length;
  const fallbackTemplateCount = 12;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let primaryCtaHref = '/login';
  let primaryCtaLabel = 'Start drafting';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (profile?.is_super_admin) {
      primaryCtaHref = '/admin';
      primaryCtaLabel = 'Go to admin';
    } else {
      primaryCtaHref = '/dashboard';
      primaryCtaLabel = 'Go to dashboard';
    }
  }

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
            <a
              href="#tech"
              className="text-[13px] text-ink-tertiary transition-colors hover:text-ink-primary"
            >
              Tech Stack
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
            <div className="border-accent/20 bg-accent/5 mx-auto mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5">
              <Sparkles size={14} className="text-accent" />
              <span className="text-[12px] font-medium text-accent">AI-Powered PRD Generator</span>
            </div>
            <h1 className="font-display text-[44px] font-bold leading-[1.08] tracking-tight text-ink-primary sm:text-[56px]">
              Draft PRDs that
              <br />
              <span className="bg-gradient-to-r from-accent to-amber-600 bg-clip-text text-transparent">
                your team can ship.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-[520px] text-[16px] leading-[1.75] text-ink-secondary">
              Turn a one-line brief into a complete, enterprise-grade PRD - with goals, user
              stories, DARCI matrix, acceptance criteria, and success metrics. Review, refine, and
              approve as a team.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href={primaryCtaHref}
                className="shadow-ink-primary/15 hover:shadow-ink-primary/20 group inline-flex h-12 items-center gap-2 rounded-xl bg-ink-primary px-7 text-[14px] font-medium text-white shadow-xl transition-all hover:shadow-2xl"
              >
                {primaryCtaLabel}
                <ChevronRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-black/10 px-6 text-[14px] font-medium text-ink-secondary transition-all hover:border-black/20 hover:bg-[#fafaf9]"
              >
                See how it works
              </a>
            </div>

            {/* Stats */}
            <LandingStats
              sectionCount={sectionCount}
              exportCount={exportCount}
              fallbackTemplateCount={fallbackTemplateCount}
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16 border-t border-black/[0.06] py-28">
        <div className="mx-auto max-w-[1140px] px-8">
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-ink-tertiary">
            How it works
          </p>
          <h2 className="mt-3 text-center font-display text-[32px] font-bold text-ink-primary">
            Three steps to a shipping-ready PRD
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-[15px] leading-relaxed text-ink-secondary">
            Stop spending days writing PRDs from scratch. DraftMind handles the structure - you
            focus on product decisions.
          </p>

          <div className="relative mx-auto mt-20 max-w-4xl">
            {/* Connecting line - desktop only */}
            <div className="from-accent/0 via-accent/20 to-accent/0 absolute left-[16.67%] right-[16.67%] top-10 hidden h-px bg-gradient-to-r sm:block" />

            <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
              {/* Step 1 */}
              <div className="group text-center">
                <div className="border-accent/15 from-accent/[0.08] to-accent/[0.02] group-hover:border-accent/25 group-hover:shadow-accent/10 relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border bg-gradient-to-b shadow-sm transition-all group-hover:shadow-md">
                  <PenLine size={28} className="text-accent" />
                  <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white shadow-sm">
                    1
                  </div>
                </div>
                <h3 className="font-display text-[18px] font-bold text-ink-primary">Brief it</h3>
                <p className="mx-auto mt-3 max-w-[260px] text-[13px] leading-[1.8] text-ink-secondary">
                  Describe your product goal in one line. DraftMind generates a complete 14-section
                  PRD with DARCI matrix, user stories, and success metrics.
                </p>
              </div>

              {/* Step 2 */}
              <div className="group text-center">
                <div className="border-accent/15 from-accent/[0.08] to-accent/[0.02] group-hover:border-accent/25 group-hover:shadow-accent/10 relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border bg-gradient-to-b shadow-sm transition-all group-hover:shadow-md">
                  <Sparkles size={28} className="text-accent" />
                  <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white shadow-sm">
                    2
                  </div>
                </div>
                <h3 className="font-display text-[18px] font-bold text-ink-primary">Refine it</h3>
                <p className="mx-auto mt-3 max-w-[260px] text-[13px] leading-[1.8] text-ink-secondary">
                  Edit with a rich text editor. Use AI copilot to expand or rewrite sections. Your
                  team adds comments and suggestions inline.
                </p>
              </div>

              {/* Step 3 */}
              <div className="group text-center">
                <div className="border-accent/15 from-accent/[0.08] to-accent/[0.02] group-hover:border-accent/25 group-hover:shadow-accent/10 relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border bg-gradient-to-b shadow-sm transition-all group-hover:shadow-md">
                  <FileOutput size={28} className="text-accent" />
                  <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white shadow-sm">
                    3
                  </div>
                </div>
                <h3 className="font-display text-[18px] font-bold text-ink-primary">Ship it</h3>
                <p className="mx-auto mt-3 max-w-[260px] text-[13px] leading-[1.8] text-ink-secondary">
                  Run AI quality review with health scoring. Move through Draft, Review, to
                  Approved. Export to PDF, Word, or share a public link.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-16 border-t border-black/[0.06] bg-[#fafaf9] py-28"
      >
        <div className="mx-auto max-w-[1140px] px-8">
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-ink-tertiary">
            Features
          </p>
          <h2 className="mt-3 text-center font-display text-[32px] font-bold text-ink-primary">
            Everything a PRD tool should have
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-[15px] leading-relaxed text-ink-secondary">
            From AI generation to team collaboration - explore what DraftMind can do.
          </p>
          <div className="relative mx-auto mt-16 max-w-3xl">
            <FeatureShowcase />
            <div className="bg-accent/[0.06] absolute -left-20 -top-20 -z-10 h-64 w-64 rounded-full blur-[100px]" />
            <div className="bg-accent/[0.04] absolute -bottom-16 -right-16 -z-10 h-48 w-48 rounded-full blur-[80px]" />
          </div>
        </div>
      </section>

      {/* AI Providers */}
      <section id="tech" className="scroll-mt-16 border-t border-black/[0.06] py-24">
        <div className="mx-auto max-w-[1140px] px-8">
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-ink-tertiary">
            Powered by
          </p>
          <h2 className="mt-3 text-center font-display text-[28px] font-bold text-ink-primary">
            Choose your AI provider
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-[14px] text-ink-secondary">
            Bring your own API key. Switch between providers anytime - your PRDs, your choice.
          </p>

          <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <AIProviderCard
              name="OpenAI"
              models="GPT-4o, GPT-4o Mini, o1-preview"
              iconSrc="/icons/providers/openai.png"
            />
            <AIProviderCard
              name="Anthropic"
              models="Claude Opus 4.6, Sonnet 4.6, Haiku 4.5"
              iconSrc="/icons/providers/anthropic.png"
            />
            <AIProviderCard
              name="Groq"
              models="Llama 3.3 70B, Llama 3.1 8B"
              iconSrc="/icons/providers/GroqAI.png"
            />
            <AIProviderCard
              name="Sumopod"
              models="GPT-4o, Claude 3 Haiku, DeepSeek"
              iconSrc="/icons/providers/sumopod.jpg"
            />
            <AIProviderCard
              name="GaNRouter"
              models="Multi-model router (Claude, GPT)"
              initial="G"
            />
          </div>
        </div>
      </section>

      {/* Export Formats */}
      <section className="border-t border-black/[0.06] bg-[#fafaf9] py-24">
        <div className="mx-auto max-w-[1140px] px-8">
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-ink-tertiary">
            Export
          </p>
          <h2 className="mt-3 text-center font-display text-[28px] font-bold text-ink-primary">
            6 export formats, zero friction
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-[14px] text-ink-secondary">
            Share your PRD anywhere - from stakeholder presentations to engineering handoffs.
          </p>

          <div className="mx-auto mt-14 grid max-w-3xl gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <ExportCard
              label="PDF"
              description=".pdf document"
              iconSrc="/icons/export/icon-pdf.png"
            />
            <ExportCard
              label="Word"
              description=".docx document"
              iconSrc="/icons/export/icon-word.png"
            />
            <ExportCard
              label="HTML"
              description=".html file"
              iconSrc="/icons/export/icon-html.png"
            />
            <ExportCard
              label="Markdown"
              description=".md file"
              iconSrc="/icons/export/icon-markdown.png"
            />
            <ExportCard
              label="Slack"
              description="Copy to Slack"
              iconSrc="/icons/export/icon-slack.png"
            />
            <ExportCard
              label="Jira"
              description="Copy to Jira"
              iconSrc="/icons/export/icon-jira.png"
            />
          </div>

          <p className="mt-8 text-center text-[12px] text-ink-tertiary">
            Plus public share links for read-only stakeholder access
          </p>
        </div>
      </section>

      {/* Built with + Security */}
      <section className="border-t border-black/[0.06] py-24">
        <div className="mx-auto max-w-[1140px] px-8">
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-ink-tertiary">
            Built with
          </p>
          <h2 className="mt-3 text-center font-display text-[32px] font-bold text-ink-primary">
            Modern, production-ready tools
          </h2>

          {/* Tech grid */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-4 gap-4 sm:grid-cols-8">
            {[
              { name: 'Next.js 15', icon: '/icons/tech/icon-nextjs.png' },
              { name: 'React 19', icon: '/icons/tech/icon-react.png' },
              { name: 'TypeScript', icon: '/icons/tech/icon-typescript.png' },
              { name: 'Supabase', icon: '/icons/tech/icon-supabase.png' },
              { name: 'PostgreSQL', icon: '/icons/tech/icon-postgresql.png' },
              { name: 'Tiptap Editor', icon: '/icons/tech/icon-tiptap.png' },
              { name: 'LangSmith', icon: '/icons/tech/icon-langsmith.webp' },
              { name: 'Vercel AI SDK', icon: '/icons/tech/icon-vercel-ai.webp' },
            ].map((t) => (
              <div
                key={t.name}
                className="group flex flex-col items-center gap-2.5 rounded-xl border border-black/[0.06] bg-white px-3 py-4 transition-all hover:border-black/[0.1] hover:shadow-md hover:shadow-black/[0.03]"
              >
                <Image
                  src={t.icon}
                  alt={t.name}
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
                <span className="text-center text-[11px] font-medium leading-tight text-ink-secondary">
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spacer before footer */}

      {/* Footer */}
      <footer className="border-t border-black/[0.06] py-10">
        <div className="mx-auto max-w-[1140px] px-8 text-center">
          <div className="flex items-center justify-center gap-2.5">
            <Image
              src="/logo/logo.jpg"
              width={20}
              height={20}
              alt="DraftMind"
              className="rounded"
            />
            <span className="text-[12px] text-ink-tertiary">&copy; 2026 DraftMind</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AIProviderCard({
  name,
  models,
  iconSrc,
  initial,
}: {
  name: string;
  models: string;
  iconSrc?: string;
  initial?: string;
}) {
  return (
    <div className="group rounded-2xl border border-black/[0.06] bg-white p-5 text-center transition-all hover:border-black/[0.1] hover:shadow-lg hover:shadow-black/[0.04]">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#f5f5f4]">
        {iconSrc ? (
          <Image
            src={iconSrc}
            alt={name}
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
        ) : (
          <span className="text-[16px] font-bold text-ink-tertiary">{initial}</span>
        )}
      </div>
      <h3 className="text-[13px] font-semibold text-ink-primary">{name}</h3>
      <p className="mt-1 text-[11px] leading-relaxed text-ink-tertiary">{models}</p>
    </div>
  );
}

function ExportCard({
  label,
  description,
  iconSrc,
}: {
  label: string;
  description: string;
  iconSrc: string;
}) {
  return (
    <div className="group flex flex-col items-center rounded-xl border border-black/[0.06] bg-white px-4 py-5 text-center transition-all hover:border-black/[0.1] hover:shadow-md hover:shadow-black/[0.03]">
      <Image
        src={iconSrc}
        alt={label}
        width={32}
        height={32}
        className="mb-2.5 h-8 w-8 object-contain"
      />
      <h3 className="text-[13px] font-semibold text-ink-primary">{label}</h3>
      <p className="mt-0.5 text-[11px] text-ink-tertiary">{description}</p>
    </div>
  );
}
