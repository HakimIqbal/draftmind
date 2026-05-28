'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  X,
  FileText,
  Star,
  FolderOpen,
  Eye,
} from 'lucide-react';
import { createPRDAndGenerate, getTemplates } from '@/app/(app)/prds/new/actions';

interface GenerateFormProps {
  userId: string;
  workspaceId: string;
  userName: string;
  initialBrief: string;
  initialTemplateId?: string | null;
  initialFocus?: 'template' | null;
  providers?: { id: string; display_name: string; default_model: string }[];
  initialMembers?: WorkspaceMember[];
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  structure: {
    sections_enabled?: string[];
    sections?: { name: string; guidelines: string }[];
    instructions?: string;
  };
  is_built_in: boolean;
}

interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

const PLATFORM_OPTIONS = [
  'Web',
  'Mobile (iOS)',
  'Mobile (Android)',
  'Mobile (Both)',
  'Desktop',
  'Cross-platform',
  'API / Backend',
];
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];

// Popular templates (built-in, shown first)
const POPULAR_NAMES = ["Adaam's PRD", "Lenny's 1-Pager", "Peter's PRD"];

export function GenerateForm({
  userId,
  workspaceId,
  userName,
  initialBrief,
  initialTemplateId,
  initialFocus,
  providers,
  initialMembers = [],
}: GenerateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Template
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [templateHighlighted, setTemplateHighlighted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Product details
  const [title, setTitle] = useState('');
  const [projectTag, setProjectTag] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [stakeholders, setStakeholders] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<WorkspaceMember[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [platform, setPlatform] = useState('');
  const [priority, setPriority] = useState('');

  // Context (collapsible)
  const [targetUsers, setTargetUsers] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [constraints, setConstraints] = useState('');

  // Technical (collapsible)
  const [techStack, setTechStack] = useState('');
  const [designLink, setDesignLink] = useState('');

  // Brief
  const [brief, setBrief] = useState(initialBrief);

  const [error, setError] = useState('');
  const [members] = useState<WorkspaceMember[]>(initialMembers);
  const [selectedProviderId, setSelectedProviderId] = useState(providers?.[0]?.id ?? '');

  const wordCount = brief.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    async function load() {
      const t = await getTemplates();
      setTemplates(t);
      if (initialTemplateId) {
        setSelectedTemplate(t.find((template) => template.id === initialTemplateId) ?? null);
      }
    }
    load();
  }, [initialTemplateId]);

  useEffect(() => {
    if (initialFocus !== 'template') return;

    const timer = window.setTimeout(() => {
      dropdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTemplateDropdownOpen(true);
      setTemplateHighlighted(true);
    }, 150);
    const clearTimer = window.setTimeout(() => setTemplateHighlighted(false), 2200);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clearTimer);
    };
  }, [initialFocus]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!templateDropdownOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTemplateDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [templateDropdownOpen]);

  // Separate popular vs rest
  const popular = templates.filter((t) =>
    POPULAR_NAMES.some((n) => t.name.includes(n.replace("'s ", "'s "))),
  );
  const rest = templates.filter(
    (t) => !POPULAR_NAMES.some((n) => t.name.includes(n.replace("'s ", "'s "))),
  );

  function showError(msg: string) {
    setError(msg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSubmit() {
    setError('');
    if (!title.trim()) {
      showError('Product name is required.');
      return;
    }
    if (!projectTag.trim()) {
      showError('Product tag is required.');
      return;
    }
    if (!problemStatement.trim()) {
      showError('Problem statement is required.');
      return;
    }
    if (!stakeholders.trim()) {
      showError('Stakeholders is required.');
      return;
    }
    if (selectedMembers.length === 0) {
      showError('At least one developer is required.');
      return;
    }
    if (!startDate) {
      showError('Start date is required.');
      return;
    }
    if (!endDate) {
      showError('End date is required.');
      return;
    }
    if (wordCount < 50) {
      showError('Brief is too short. Minimum 50 words required.');
      return;
    }

    startTransition(async () => {
      try {
        await createPRDAndGenerate({
          workspaceId,
          userId,
          title: title.trim(),
          projectTag: projectTag.trim(),
          brief: brief.trim(),
          startDate,
          endDate,
          stakeholders: stakeholders.trim() || undefined,
          teamMemberIds: selectedMembers.map((m) => m.id),
          teamMemberNames: selectedMembers.map((m) => m.name),
          teamMemberRoles: selectedMembers.map((m) => m.role),
          problemStatement: problemStatement.trim() || undefined,
          targetUsers: targetUsers.trim() || undefined,
          constraints: constraints.trim() || undefined,
          successCriteria: successCriteria.trim() || undefined,
          platform: platform || undefined,
          priority: priority || undefined,
          techStack: techStack.trim() || undefined,
          designLink: designLink.trim() || undefined,
          templateId: selectedTemplate?.id,
          templateName: selectedTemplate?.name,
          preferredProviderId: selectedProviderId || undefined,
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          showError(err.message || 'Failed to create PRD. Please try again.');
        } else {
          showError('Failed to create PRD. Please try again.');
        }
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 md:px-8 md:py-8">
      <button
        onClick={() => router.push('/prds')}
        className="mb-4 flex items-center gap-1.5 text-[13px] text-[#999] hover:text-[#555]"
      >
        <ArrowLeft size={13} /> Back to PRDs
      </button>
      <h1 className="text-[22px] font-bold text-[#1a1a1a]">Create new PRD</h1>

      {/* Error banner — top of form */}
      {error && (
        <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" />
            <path d="M8 5v3.5M8 10.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="flex-1 text-[13px] text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => setError('')}
            className="shrink-0 text-red-400 hover:text-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {/* Template dropdown */}
        <div
          className={`relative rounded-xl transition-all duration-300 ${
            templateHighlighted ? 'ring-accent/40 ring-offset-bg-base ring-2 ring-offset-4' : ''
          }`}
          ref={dropdownRef}
        >
          <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">Template</label>
          <button
            type="button"
            onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
            className="flex h-10 w-full items-center justify-between rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] transition-colors hover:border-[#ccc]"
          >
            <span className="flex items-center gap-2">
              <FileText size={14} className="text-[#999]" />
              {selectedTemplate ? selectedTemplate.name : 'None (start from scratch)'}
            </span>
            <ChevronDown size={14} className="text-[#999]" />
          </button>

          {templateDropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[360px] overflow-y-auto rounded-xl border border-[#eee] bg-white shadow-xl">
              {/* None option */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTemplate(null);
                  setTemplateDropdownOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-[#fafaf9] ${!selectedTemplate ? 'bg-[#f5f5f4] font-medium' : ''}`}
              >
                <FileText size={14} className="text-[#bbb]" />
                None (start from scratch)
              </button>

              {/* Popular */}
              {popular.length > 0 && (
                <>
                  <div className="border-t border-[#f0f0f0] px-4 py-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#aaa]">
                      <Star size={10} className="text-amber-400" />
                      Popular
                    </span>
                  </div>
                  {popular.map((t) => (
                    <div
                      key={t.id}
                      className={`flex w-full items-start gap-2.5 px-4 py-2.5 transition-colors hover:bg-[#fafaf9] ${selectedTemplate?.id === t.id ? 'bg-[#f5f5f4]' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(t);
                          setTemplateDropdownOpen(false);
                        }}
                        className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                      >
                        <FileText size={14} className="mt-0.5 shrink-0 text-accent" />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-[#1a1a1a]">{t.name}</p>
                          {t.description && (
                            <p className="mt-0.5 truncate text-[11px] text-[#999]">
                              {t.description}
                            </p>
                          )}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTemplateDropdownOpen(false);
                          setPreviewTemplate(t);
                        }}
                        className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] text-[#bbb] transition-colors hover:bg-[#eee] hover:text-[#666]"
                        title="View template details"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  ))}
                </>
              )}

              {/* All templates */}
              {rest.length > 0 && (
                <>
                  <div className="border-t border-[#f0f0f0] px-4 py-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#aaa]">
                      <FolderOpen size={10} />
                      All templates
                    </span>
                  </div>
                  {rest.map((t) => (
                    <div
                      key={t.id}
                      className={`flex w-full items-start gap-2.5 px-4 py-2.5 transition-colors hover:bg-[#fafaf9] ${selectedTemplate?.id === t.id ? 'bg-[#f5f5f4]' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(t);
                          setTemplateDropdownOpen(false);
                        }}
                        className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                      >
                        <FileText size={14} className="mt-0.5 shrink-0 text-[#bbb]" />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-[#1a1a1a]">{t.name}</p>
                          {t.description && (
                            <p className="mt-0.5 truncate text-[11px] text-[#999]">
                              {t.description}
                            </p>
                          )}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTemplateDropdownOpen(false);
                          setPreviewTemplate(t);
                        }}
                        className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] text-[#bbb] transition-colors hover:bg-[#eee] hover:text-[#666]"
                        title="View template details"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Selected template info */}
        {selectedTemplate && (
          <div className="border-accent/20 bg-accent/5 rounded-lg border px-4 py-3">
            <div className="flex items-center gap-3">
              <FileText size={16} className="shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[#1a1a1a]">{selectedTemplate.name}</p>
                {selectedTemplate.description && (
                  <p className="mt-0.5 text-[11px] text-[#888]">{selectedTemplate.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(selectedTemplate)}
                className="border-accent/30 hover:bg-accent/10 flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium text-accent transition-colors"
              >
                <Eye size={12} />
                View details
              </button>
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="shrink-0 text-[#bbb] hover:text-[#666]"
              >
                <X size={14} />
              </button>
            </div>
            {/* Section pills preview */}
            {selectedTemplate.structure.sections &&
              selectedTemplate.structure.sections.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {selectedTemplate.structure.sections.map((s, i) => (
                    <span
                      key={i}
                      className="bg-accent/10 rounded px-2 py-0.5 text-[10px] font-medium text-accent"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* Product details */}
        <Section title="Product details">
          <div className="space-y-4">
            <Field label="Product name" required>
              <TextInput
                value={title}
                onChange={setTitle}
                placeholder="e.g. Checkout Redesign Q2"
              />
            </Field>
            <Field label="Document Owner">
              <TextInput value={userName} readOnly />
            </Field>
            <Field label="Product tag" required>
              <TextInput
                value={projectTag}
                onChange={setProjectTag}
                placeholder="e.g. Q2 2026 Growth"
              />
            </Field>
            <Field label="Problem statement" required>
              <TextareaInput
                value={problemStatement}
                onChange={setProblemStatement}
                rows={3}
                placeholder="What problem does this product/feature solve?"
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Stakeholders" required hint="Decision makers, approvers">
                <TextInput
                  value={stakeholders}
                  onChange={setStakeholders}
                  placeholder="e.g. Denis Setyawan"
                />
              </Field>
              <Field label="Developer" required hint="Type @ to mention">
                <MemberPicker
                  members={members}
                  selected={selectedMembers}
                  onChange={setSelectedMembers}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Start date" required>
                <DateInput value={startDate} onChange={setStartDate} />
              </Field>
              <Field label="End date" required>
                <DateInput value={endDate} onChange={setEndDate} />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Platform">
                <SelectInput
                  value={platform}
                  onChange={setPlatform}
                  options={PLATFORM_OPTIONS}
                  placeholder="Select platform..."
                />
              </Field>
              <Field label="Priority">
                <SelectInput
                  value={priority}
                  onChange={setPriority}
                  options={PRIORITY_OPTIONS}
                  placeholder="Select priority..."
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* Context */}
        <CollapsibleSection title="Context" defaultOpen={false}>
          <div className="space-y-4">
            <Field label="Target users">
              <TextInput
                value={targetUsers}
                onChange={setTargetUsers}
                placeholder="e.g. Eco-conscious travelers aged 25-40"
              />
            </Field>
            <Field label="Success criteria">
              <TextInput
                value={successCriteria}
                onChange={setSuccessCriteria}
                placeholder="e.g. 20% increase in conversion rate"
              />
            </Field>
            <Field label="Constraints">
              <TextInput
                value={constraints}
                onChange={setConstraints}
                placeholder="e.g. Must support offline mode, budget $50k"
              />
            </Field>
          </div>
        </CollapsibleSection>

        {/* Technical */}
        <CollapsibleSection title="Technical" defaultOpen={false}>
          <div className="space-y-4">
            <Field label="Tech stack">
              <TextInput
                value={techStack}
                onChange={setTechStack}
                placeholder="e.g. Next.js, Supabase, React Native"
              />
            </Field>
            <Field label="Design reference">
              <TextInput
                value={designLink}
                onChange={setDesignLink}
                placeholder="e.g. https://figma.com/file/..."
              />
            </Field>
          </div>
        </CollapsibleSection>

        {/* Brief */}
        <Section title="Brief" required>
          <TextareaInput
            value={brief}
            onChange={setBrief}
            rows={8}
            placeholder="Describe the product, feature, or problem you want to solve..."
          />
          <p className="mt-2 text-[11px] text-[#bbb]">
            {wordCount} words &middot;{' '}
            {wordCount < 50
              ? 'Minimum 50 words required'
              : wordCount < 200
                ? '200+ recommended'
                : 'Good length'}
          </p>
        </Section>

        {/* Error shown at top of form */}
      </div>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreviewTemplate(null)} />
          <div className="relative max-h-[86vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-subtle bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewTemplate(null)}
              className="absolute right-4 top-4 rounded-md p-1 text-ink-tertiary transition-colors hover:bg-bg-surface hover:text-ink-primary"
              aria-label="Close template preview"
            >
              <X size={18} />
            </button>

            <div className="border-b border-subtle px-4 py-4 md:px-8 md:py-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                Template Preview
              </p>
              <h2 className="mt-1 pr-8 text-[22px] font-bold text-ink-primary">
                {previewTemplate.name}
              </h2>
              {previewTemplate.description && (
                <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-secondary">
                  {previewTemplate.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-subtle bg-bg-surface px-3 py-1 font-mono text-[11px] text-ink-tertiary">
                  {previewTemplate.category}
                </span>
                {previewTemplate.structure.sections &&
                  previewTemplate.structure.sections.length > 0 && (
                    <span className="rounded-full border border-subtle bg-bg-surface px-3 py-1 font-mono text-[11px] text-ink-tertiary">
                      {previewTemplate.structure.sections.length} sections
                    </span>
                  )}
                {previewTemplate.structure.sections_enabled &&
                  previewTemplate.structure.sections_enabled.length > 0 && (
                    <span className="rounded-full border border-subtle bg-bg-surface px-3 py-1 font-mono text-[11px] text-ink-tertiary">
                      {previewTemplate.structure.sections_enabled.length} enabled sections
                    </span>
                  )}
              </div>
            </div>

            <div className="space-y-5 px-4 py-4 md:px-8 md:py-6">
              {previewTemplate.structure.instructions && (
                <div className="border-accent/20 bg-accent/5 rounded-xl border px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                    How this template should be used
                  </p>
                  <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-ink-primary">
                    {previewTemplate.structure.instructions}
                  </p>
                </div>
              )}

              {previewTemplate.structure.sections &&
              previewTemplate.structure.sections.length > 0 ? (
                <div>
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">
                        Template contents
                      </p>
                      <p className="mt-1 text-[12px] text-ink-secondary">
                        Read the full template content section by section before using it.
                      </p>
                    </div>
                    <p className="shrink-0 font-mono text-[11px] text-ink-tertiary">
                      {previewTemplate.structure.sections.length} total
                    </p>
                  </div>

                  <div className="space-y-3">
                    {previewTemplate.structure.sections.map((section, index) => {
                      const guideline = section.guidelines?.trim();
                      return (
                        <div
                          key={`${section.name}-${index}`}
                          className="rounded-xl border border-subtle bg-white p-5 shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 w-8 shrink-0 font-mono text-[13px] font-semibold text-ink-tertiary">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-[16px] font-semibold text-ink-primary">
                                {section.name}
                              </h3>
                              {guideline ? (
                                <pre className="mt-4 whitespace-pre-wrap break-words border-t border-subtle pt-4 font-sans text-[13px] leading-7 text-ink-secondary">
                                  {guideline}
                                </pre>
                              ) : (
                                <p className="mt-4 border-t border-subtle pt-4 text-[13px] leading-relaxed text-ink-tertiary">
                                  No detailed content was provided for this section. The PRD
                                  generator will still create a structured section based on the
                                  template name and brief.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : previewTemplate.structure.sections_enabled &&
                previewTemplate.structure.sections_enabled.length > 0 ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">
                    Enabled sections
                  </p>
                  <p className="mt-1 text-[12px] text-ink-secondary">
                    This template defines the section names only. The generator will fill each
                    enabled section from the brief.
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {previewTemplate.structure.sections_enabled.map((section, index) => (
                      <div
                        key={`${section}-${index}`}
                        className="rounded-xl border border-subtle bg-bg-surface px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="ring-subtle flex h-5 w-5 items-center justify-center rounded-full bg-white font-mono text-[10px] font-semibold text-ink-tertiary ring-1">
                            {index + 1}
                          </span>
                          <p className="text-[13px] font-medium capitalize text-ink-primary">
                            {section.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-subtle bg-bg-surface px-4 py-8 text-center">
                  <p className="text-sm font-medium text-ink-primary">
                    No section details available
                  </p>
                  <p className="mt-1 text-[12px] text-ink-secondary">
                    This template does not include detailed section metadata yet.
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-subtle bg-white/95 px-4 py-4 backdrop-blur sm:flex-row sm:justify-end md:px-8">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="h-9 rounded-lg border border-subtle bg-white px-4 text-[13px] font-medium text-ink-secondary transition-colors hover:border-strong hover:text-ink-primary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="h-9 w-full rounded-lg bg-accent px-5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
              >
                Use this template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        {providers && providers.length > 1 && (
          <select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            className="h-9 rounded-lg border border-[#e5e5e3] bg-white px-3 text-[12px] text-[#555]"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name} ({p.default_model})
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => router.push('/prds')}
          className="h-9 w-full rounded-lg border border-[#e5e5e3] bg-white px-4 text-[13px] font-medium text-[#666] hover:border-[#ddd] hover:text-[#1a1a1a] sm:w-auto"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="h-9 w-full rounded-lg bg-accent px-5 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-30 sm:w-auto"
        >
          {isPending ? 'Generating...' : 'Generate PRD'}
        </button>
      </div>
    </div>
  );
}

// ─── @ Mention Member Picker ───

function MemberPicker({
  members,
  selected,
  onChange,
}: {
  members: WorkspaceMember[];
  selected: WorkspaceMember[];
  onChange: (m: WorkspaceMember[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedQuery = query.replace(/^@+/, '').trim().toLowerCase();
  const filtered = members.filter((m) => {
    if (selected.some((s) => s.id === m.id)) return false;
    if (!normalizedQuery) return true;

    return [m.name, m.email, m.role]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedQuery));
  });

  function handleSelect(member: WorkspaceMember) {
    onChange([...selected, member]);
    setQuery('');
    setShowDropdown(false);
    inputRef.current?.focus();
  }

  function handleRemove(id: string) {
    onChange(selected.filter((m) => m.id !== id));
  }

  function handleInputChange(value: string) {
    setQuery(value.replace(/^@+/, ''));
    setShowDropdown(true);
  }

  return (
    <div className="relative">
      <div className="focus-within:ring-accent/30 flex min-h-[40px] flex-wrap items-center gap-1.5 rounded-lg border border-[#e5e5e3] bg-white px-2 py-1.5 focus-within:border-accent focus-within:ring-1">
        {selected.map((m) => (
          <span
            key={m.id}
            className="inline-flex items-center gap-1 rounded-md bg-[#f0f0ee] px-2 py-0.5 text-[12px] text-[#555]"
          >
            {m.name}
            <button onClick={() => handleRemove(m.id)} className="text-[#bbb] hover:text-[#666]">
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (members.length > 0) setShowDropdown(true);
          }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder={selected.length === 0 ? 'Type @ to mention...' : ''}
          className="min-w-[120px] flex-1 border-none bg-transparent text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:outline-none"
        />
      </div>

      {showDropdown && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-[200px] overflow-y-auto rounded-xl border border-[#eee] bg-white shadow-lg">
          {filtered.map((m) => (
            <button
              key={m.id}
              onMouseDown={() => handleSelect(m)}
              className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-[#fafaf9]"
            >
              <div>
                <p className="text-[13px] font-medium text-[#1a1a1a]">{m.name}</p>
                <p className="text-[11px] text-[#999]">{m.email}</p>
              </div>
              <span className="rounded bg-[#f5f5f4] px-1.5 py-0.5 text-[10px] capitalize text-[#999]">
                {m.role}
              </span>
            </button>
          ))}
        </div>
      )}

      {showDropdown && filtered.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-[#eee] bg-white p-3 text-center shadow-lg">
          <p className="text-[12px] text-[#999]">
            {members.length === 0 ? 'No workspace members available' : 'No matching members found'}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── UI Components ───

function Section({
  title,
  required,
  children,
}: {
  title: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#eee] bg-white p-6">
      <h2 className="mb-5 text-[14px] font-semibold text-[#1a1a1a]">
        {title} {required && <span className="text-red-400">*</span>}
      </h2>
      {children}
    </div>
  );
}

function CollapsibleSection({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-[#eee] bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-6 text-left"
      >
        <h2 className="text-[14px] font-semibold text-[#1a1a1a]">{title}</h2>
        {open ? (
          <ChevronDown size={16} className="text-[#999]" />
        ) : (
          <ChevronRight size={16} className="text-[#999]" />
        )}
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-[#1a1a1a]">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {hint && <p className="mb-1.5 text-[11px] text-[#bbb]">{hint}</p>}
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] px-3 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1 ${readOnly ? 'bg-[#fafaf9] text-[#999]' : 'bg-white'}`}
    />
  );
}

function TextareaInput({
  value,
  onChange,
  placeholder,
  rows,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows ?? 4}
      className="focus:ring-accent/30 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 py-2.5 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
    />
  );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] focus:border-accent focus:outline-none focus:ring-1"
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white px-3 text-[13px] text-[#1a1a1a] focus:border-accent focus:outline-none focus:ring-1"
    >
      <option value="">{placeholder ?? 'Select...'}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
