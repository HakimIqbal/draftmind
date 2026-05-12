'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  PenLine,
  BarChart3,
  LayoutTemplate,
  Users,
  History,
  MessageSquare,
  FileOutput,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI PRD Generation',
    subtitle: 'One brief. Complete PRD.',
    description:
      'Write a one-line brief and AI generates a full 14-section PRD - overview, DARCI matrix, user stories, requirements, success metrics, timeline, and more.',
    visual: [
      { label: 'Input', value: '"Reduce checkout abandonment by 15%"' },
      { label: 'Output', value: '14 sections, ~3000 words, ready to review' },
      { label: 'Time', value: '< 60 seconds' },
    ],
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: PenLine,
    title: 'Rich Text Editor',
    subtitle: 'Google Docs-like editing.',
    description:
      'Full WYSIWYG editor with slash commands, tables, task lists, and real-time auto-save. Versions created automatically during editing.',
    visual: [
      { label: 'Editor', value: 'Tiptap + ProseMirror engine' },
      { label: 'Features', value: 'Slash commands, tables, checklists' },
      { label: 'Auto-save', value: 'Debounced save + periodic versioning' },
    ],
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Sparkles,
    title: 'AI Copilot & Refine',
    subtitle: 'Your AI writing partner.',
    description:
      'Inline AI copilot for any section - expand, rewrite, simplify, or ask questions about your PRD. Refine specific sections with custom instructions.',
    visual: [
      { label: 'Copilot', value: 'Chat about your PRD, get suggestions' },
      { label: 'Refine', value: 'Improve any section with AI' },
      { label: 'Actions', value: 'Expand, simplify, formalize, translate' },
    ],
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: BarChart3,
    title: 'AI Quality Review',
    subtitle: 'Health score for your PRD.',
    description:
      'AI scores your PRD on completeness, specificity, structural quality, and consistency. Get actionable findings with severity levels and suggested fixes.',
    visual: [
      { label: 'Score', value: '0-100 health score with breakdown' },
      { label: 'Findings', value: 'Critical, warning, info severity' },
      { label: 'Fix', value: 'One-click AI improvement suggestions' },
    ],
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: LayoutTemplate,
    title: 'Template Library',
    subtitle: 'Start from proven structures.',
    description:
      'Choose from 29+ templates - Feature PRD, Technical Design Doc, API Documentation, Go-to-Market Plan, OKRs, Bug Fix Plan, and more.',
    visual: [
      { label: 'Built-in', value: '29+ professional templates' },
      { label: 'Custom', value: 'Create your own templates' },
      { label: 'Categories', value: 'Product, Engineering, Strategy, Research' },
    ],
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    subtitle: 'Role-based workspace.',
    description:
      'Invite your team with Admin, Editor, Commenter, or Viewer roles. DARCI matrix auto-assigns based on professional roles. Manage workspace members.',
    visual: [
      { label: 'Roles', value: 'Admin, Editor, Commenter, Viewer' },
      { label: 'DARCI', value: 'Auto-assigned from team roles' },
      { label: 'Workspace', value: 'Multi-workspace support' },
    ],
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: MessageSquare,
    title: 'Inline Comments',
    subtitle: 'Discuss in context.',
    description:
      'Threaded comments on any text selection with colored highlights. Mention teammates, resolve discussions, and track feedback - all inline.',
    visual: [
      { label: 'Select', value: 'Highlight any text to comment' },
      { label: 'Threads', value: 'Reply chains with resolution' },
      { label: 'Colors', value: '8 highlight colors, auto-cycled' },
    ],
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: History,
    title: 'Version History',
    subtitle: 'Never lose a word.',
    description:
      'Full version history with per-character diff highlighting. Compare any two versions, restore previous states, and name important milestones.',
    visual: [
      { label: 'Tracking', value: 'Auto-versioning on idle + interval' },
      { label: 'Diff', value: 'Character-level change highlighting' },
      { label: 'Restore', value: 'One-click restore to any version' },
    ],
    color: 'from-slate-500 to-gray-600',
  },
  {
    icon: FileOutput,
    title: 'Multi-format Export',
    subtitle: '6 formats, zero friction.',
    description:
      'Export to PDF, Word (DOCX), HTML, Markdown, Slack-formatted text, or Jira wiki markup. Share public read-only links with stakeholders.',
    visual: [
      { label: 'Formats', value: 'PDF, Word, HTML, Markdown, Slack, Jira' },
      { label: 'Share', value: 'Public read-only links' },
      { label: 'Quality', value: 'Styled, print-ready output' },
    ],
    color: 'from-teal-500 to-green-500',
  },
  {
    icon: Eye,
    title: 'AI Observability',
    subtitle: 'Full transparency.',
    description:
      'Monitor every AI call with LangSmith integration. Track latency, token usage, cost, and success rate per operation. Know exactly what your AI is doing.',
    visual: [
      { label: 'Tracking', value: 'Every AI call logged' },
      { label: 'Metrics', value: 'Latency, tokens, cost, success rate' },
      { label: 'Provider', value: 'Per-provider performance stats' },
    ],
    color: 'from-indigo-500 to-violet-500',
  },
] as const;

export function FeatureShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setActive((i) => (i + 1) % FEATURES.length), []);
  const prev = useCallback(() => setActive((i) => (i - 1 + FEATURES.length) % FEATURES.length), []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next]);

  const feature = FEATURES[active]!;
  const Icon = feature.icon;

  return (
    <div
      className="rounded-2xl border border-black/[0.08] bg-white shadow-2xl shadow-black/[0.06]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Header with nav dots */}
      <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${feature.color} text-white`}
          >
            <Icon size={14} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-ink-primary">{feature.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="rounded-md p-1 text-ink-tertiary transition-colors hover:bg-black/[0.04] hover:text-ink-primary"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-mono text-[11px] text-ink-tertiary">
            {active + 1}/{FEATURES.length}
          </span>
          <button
            onClick={next}
            className="rounded-md p-1 text-ink-tertiary transition-colors hover:bg-black/[0.04] hover:text-ink-primary"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid sm:grid-cols-[1fr,260px]">
        <div className="p-6 sm:p-8">
          <p className="text-[15px] font-semibold text-ink-primary">{feature.subtitle}</p>
          <p className="mt-2.5 text-[13px] leading-[1.8] text-ink-secondary">
            {feature.description}
          </p>

          {/* Visual data points */}
          <div className="mt-6 space-y-3">
            {feature.visual.map((v) => (
              <div key={v.label} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 rounded bg-black/[0.04] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
                  {v.label}
                </span>
                <span className="text-[13px] text-ink-secondary">{v.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Feature list sidebar */}
        <div className="hidden border-l border-black/[0.06] p-5 sm:block">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-widest text-ink-tertiary">
            Features
          </p>
          <div className="mt-3 space-y-1">
            {FEATURES.map((f, i) => {
              const FIcon = f.icon;
              return (
                <button
                  key={f.title}
                  onClick={() => setActive(i)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all ${
                    i === active
                      ? 'bg-black/[0.04] text-ink-primary'
                      : 'text-ink-tertiary hover:bg-black/[0.02] hover:text-ink-secondary'
                  }`}
                >
                  <FIcon size={12} className={i === active ? 'text-accent' : ''} />
                  <span className="truncate text-[11px]">{f.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 border-t border-black/[0.06] py-3">
        {FEATURES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? 'w-6 bg-accent' : 'w-1.5 bg-black/[0.1] hover:bg-black/[0.2]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
