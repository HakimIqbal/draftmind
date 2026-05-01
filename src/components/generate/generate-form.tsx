'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, LayoutTemplate, ArrowLeft, ChevronDown, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  createPRDAndGenerate,
  createPRDFromTemplate,
  getTemplates,
  getWorkspaceMembers,
} from '@/app/(app)/prds/new/actions';

interface GenerateFormProps {
  userId: string;
  workspaceId: string;
  userName: string;
  initialBrief: string;
}

interface TemplateSection {
  name: string;
  guidelines: string;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  structure: { sections_enabled?: string[]; sections?: TemplateSection[] };
  is_built_in: boolean;
}

interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  feature: 'Feature',
  experiment: 'Experiment',
  rfc: 'Technical',
  'one-pager': 'One-pager',
  research: 'Research',
  custom: 'Custom',
};
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

export function GenerateForm({ userId, workspaceId, userName, initialBrief }: GenerateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<'scratch' | 'template'>('scratch');

  // Wajib
  const [title, setTitle] = useState('');
  const [projectTag, setProjectTag] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [brief, setBrief] = useState(initialBrief);

  // Di Project details (penting)
  const [platform, setPlatform] = useState('');
  const [priority, setPriority] = useState('');
  const [stakeholders, setStakeholders] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<WorkspaceMember[]>([]);
  const [problemStatement, setProblemStatement] = useState('');

  // Context (collapsible)
  const [targetUsers, setTargetUsers] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [constraints, setConstraints] = useState('');

  // Technical (collapsible)
  const [techStack, setTechStack] = useState('');
  const [designLink, setDesignLink] = useState('');

  const [error, setError] = useState('');
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  // Template state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateTag, setTemplateTag] = useState('');
  const [templateBrief, setTemplateBrief] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  const wordCount = brief.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    async function load() {
      const [t, m] = await Promise.all([getTemplates(), getWorkspaceMembers(workspaceId)]);
      setTemplates(t);
      setMembers(m);
    }
    load();
  }, [workspaceId]);

  function handleScratchSubmit() {
    setError('');
    if (!title.trim()) {
      setError('Project name is required.');
      return;
    }
    if (!projectTag.trim()) {
      setError('Project tag is required.');
      return;
    }
    if (!problemStatement.trim()) {
      setError('Problem statement is required.');
      return;
    }
    if (!stakeholders.trim()) {
      setError('Stakeholders is required.');
      return;
    }
    if (selectedMembers.length === 0) {
      setError('At least one team member is required.');
      return;
    }
    if (!startDate) {
      setError('Start date is required.');
      return;
    }
    if (!endDate) {
      setError('End date is required.');
      return;
    }
    if (wordCount < 50) {
      setError('Brief is too short. Minimum 50 words required.');
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
          problemStatement: problemStatement.trim() || undefined,
          targetUsers: targetUsers.trim() || undefined,
          constraints: constraints.trim() || undefined,
          successCriteria: successCriteria.trim() || undefined,
          platform: platform || undefined,
          priority: priority || undefined,
          techStack: techStack.trim() || undefined,
          designLink: designLink.trim() || undefined,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });
  }

  function handleTemplateSubmit() {
    if (!selectedTemplate) {
      toast.error('Select a template first');
      return;
    }
    if (!templateTitle.trim()) {
      toast.error('Project name is required');
      return;
    }
    if (!templateBrief.trim()) {
      toast.error('Brief is required');
      return;
    }
    startTransition(async () => {
      try {
        await createPRDFromTemplate({
          workspaceId,
          userId,
          title: templateTitle.trim(),
          projectTag: templateTag.trim() || undefined,
          templateId: selectedTemplate.id,
          brief: templateBrief.trim(),
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong.');
      }
    });
  }

  const grouped = templates.reduce<Record<string, Template[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <button
        onClick={() => router.push('/prds')}
        className="mb-4 flex items-center gap-1.5 text-[13px] text-[#999] hover:text-[#555]"
      >
        <ArrowLeft size={13} /> Back to PRDs
      </button>
      <h1 className="text-[22px] font-bold text-[#1a1a1a]">Create new PRD</h1>

      <div className="mt-6 flex gap-2">
        <TabBtn
          active={tab === 'scratch'}
          icon={FileText}
          label="From scratch"
          onClick={() => setTab('scratch')}
        />
        <TabBtn
          active={tab === 'template'}
          icon={LayoutTemplate}
          label="From template"
          onClick={() => setTab('template')}
        />
      </div>

      {/* ─── FROM SCRATCH ─── */}
      {tab === 'scratch' && (
        <div className="mt-6 space-y-5">
          <Section title="Project details">
            <div className="space-y-4">
              <Field label="Project name" required>
                <TextInput
                  value={title}
                  onChange={setTitle}
                  placeholder="e.g. Checkout Redesign Q2"
                />
              </Field>
              <Field label="Owner">
                <TextInput value={userName} readOnly />
              </Field>
              <Field label="Project tag" required>
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
              <Field label="Stakeholders" required hint="Decision makers, approvers, clients">
                <TextInput
                  value={stakeholders}
                  onChange={setStakeholders}
                  placeholder="e.g. Eric Julianto, Denis Setyawan"
                />
              </Field>
              <Field label="Team members" required hint="Type @ to mention workspace members">
                <MemberPicker
                  members={members}
                  selected={selectedMembers}
                  onChange={setSelectedMembers}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start date" required>
                  <DateInput value={startDate} onChange={setStartDate} />
                </Field>
                <Field label="End date" required>
                  <DateInput value={endDate} onChange={setEndDate} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
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

          <Section title="Brief" required>
            <TextareaInput
              value={brief}
              onChange={setBrief}
              rows={8}
              placeholder="Describe the product, feature, or problem you want to solve..."
            />
            <p className="mt-2 text-[11px] text-[#bbb]">
              {wordCount} words ·{' '}
              {wordCount < 50
                ? 'Minimum 50 words required'
                : wordCount < 200
                  ? '200+ recommended'
                  : 'Good length'}
            </p>
          </Section>

          {error && <p className="text-[13px] text-red-500">{error}</p>}
        </div>
      )}

      {/* ─── FROM TEMPLATE ─── */}
      {tab === 'template' && (
        <div className="mt-6 space-y-5">
          {!selectedTemplate ? (
            <div>
              {/* Search */}
              <div className="relative mb-5">
                <input
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Search templates..."
                  className="focus:ring-accent/30 h-10 w-full rounded-lg border border-[#e5e5e3] bg-white pl-3 pr-3 text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:border-accent focus:outline-none focus:ring-1"
                />
              </div>

              {/* Categories */}
              {Object.entries(grouped).map(([cat, items]) => {
                const filtered = templateSearch
                  ? items.filter(
                      (t) =>
                        t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                        (t.description ?? '').toLowerCase().includes(templateSearch.toLowerCase()),
                    )
                  : items;
                if (filtered.length === 0) return null;
                const isCollapsed = collapsedCats.has(cat);
                return (
                  <div key={cat} className="mb-4">
                    <button
                      onClick={() => {
                        const next = new Set(collapsedCats);
                        if (isCollapsed) {
                          next.delete(cat);
                        } else {
                          next.add(cat);
                        }
                        setCollapsedCats(next);
                      }}
                      className="mb-2 flex w-full items-center gap-2 text-left"
                    >
                      {isCollapsed ? (
                        <ChevronRight size={13} className="text-[#bbb]" />
                      ) : (
                        <ChevronDown size={13} className="text-[#bbb]" />
                      )}
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#aaa]">
                        {CATEGORY_LABELS[cat] ?? cat}
                      </span>
                      <span className="text-[10px] text-[#ccc]">({filtered.length})</span>
                    </button>
                    {!isCollapsed && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {filtered.map((t) => {
                          const sections = t.structure.sections ?? [];
                          const sectionNames = sections.map((s: { name: string }) => s.name);
                          return (
                            <button
                              key={t.id}
                              onClick={() => setPreviewTemplate(t)}
                              className="rounded-xl border border-[#eee] bg-white p-4 text-left transition-all hover:border-[#ddd] hover:shadow-sm"
                            >
                              <p className="text-[13px] font-medium text-[#1a1a1a]">{t.name}</p>
                              <p className="mt-1 line-clamp-2 text-[12px] text-[#999]">
                                {t.description}
                              </p>
                              {sectionNames.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                  {sectionNames.map((name: string, i: number) => (
                                    <span
                                      key={i}
                                      className="rounded bg-[#f5f5f4] px-1.5 py-0.5 text-[10px] text-[#888]"
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Template form */
            <div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="mb-4 flex items-center gap-1.5 text-[13px] text-[#999] hover:text-[#555]"
              >
                <ArrowLeft size={13} /> Choose different template
              </button>
              <Section title={selectedTemplate.name}>
                <p className="mb-4 text-[12px] text-[#999]">{selectedTemplate.description}</p>
                <div className="space-y-4">
                  <Field label="Project name" required>
                    <TextInput
                      value={templateTitle}
                      onChange={setTemplateTitle}
                      placeholder="e.g. Checkout Redesign Q2"
                    />
                  </Field>
                  <Field label="Project tag">
                    <TextInput
                      value={templateTag}
                      onChange={setTemplateTag}
                      placeholder="e.g. Q2 2026 Growth"
                    />
                  </Field>
                  <Field
                    label="Brief"
                    required
                    hint="Give context so AI can generate relevant content for this template"
                  >
                    <TextareaInput
                      value={templateBrief}
                      onChange={setTemplateBrief}
                      rows={4}
                      placeholder="Briefly describe what this document is about..."
                    />
                  </Field>
                </div>
              </Section>
            </div>
          )}
        </div>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreviewTemplate(null)} />
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <button
              onClick={() => setPreviewTemplate(null)}
              className="absolute right-4 top-4 text-[#bbb] hover:text-[#666]"
            >
              <X size={18} />
            </button>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
              {CATEGORY_LABELS[previewTemplate.category] ?? previewTemplate.category}
            </p>
            <h2 className="mt-1 text-[20px] font-bold text-[#1a1a1a]">{previewTemplate.name}</h2>
            <p className="mt-2 text-[13px] text-[#888]">{previewTemplate.description}</p>

            <div className="mt-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#aaa]">
                Sections (
                {previewTemplate.structure.sections?.length ??
                  previewTemplate.structure.sections_enabled?.length ??
                  0}
                )
              </p>
              <div className="space-y-3">
                {(previewTemplate.structure.sections ?? []).map((s, i) => (
                  <div key={i} className="rounded-lg border border-[#eee] bg-[#fafaf9] p-4">
                    <h3 className="text-[13px] font-semibold text-[#1a1a1a]">{s.name}</h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-[#888]">{s.guidelines}</p>
                  </div>
                ))}
                {/* Fallback for old format */}
                {!previewTemplate.structure.sections &&
                  (previewTemplate.structure.sections_enabled ?? []).map((s, i) => (
                    <div key={i} className="rounded-lg border border-[#eee] bg-[#fafaf9] p-4">
                      <h3 className="text-[13px] font-semibold text-[#1a1a1a]">
                        {s.replace(/_/g, ' ')}
                      </h3>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setSelectedTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="h-9 rounded-lg bg-accent px-5 text-[13px] font-medium text-white hover:opacity-90"
              >
                Use this template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          onClick={() => router.push('/prds')}
          className="h-9 rounded-lg border border-[#e5e5e3] bg-white px-4 text-[13px] font-medium text-[#666] hover:border-[#ddd] hover:text-[#1a1a1a]"
        >
          Cancel
        </button>
        {tab === 'scratch' ? (
          <button
            onClick={handleScratchSubmit}
            disabled={isPending}
            className="h-9 rounded-lg bg-accent px-5 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-30"
          >
            {isPending ? 'Generating...' : 'Generate PRD'}
          </button>
        ) : (
          <button
            onClick={handleTemplateSubmit}
            disabled={isPending || !selectedTemplate}
            className="h-9 rounded-lg bg-accent px-5 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-30"
          >
            {isPending ? 'Creating...' : 'Create from template'}
          </button>
        )}
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

  const filtered = members.filter(
    (m) =>
      !selected.some((s) => s.id === m.id) &&
      (m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.email.toLowerCase().includes(query.toLowerCase())),
  );

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
    setQuery(value);
    if (value.includes('@')) {
      setQuery(value.replace('@', ''));
      setShowDropdown(true);
    } else if (value.length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }

  return (
    <div className="relative">
      {/* Selected chips */}
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
            if (query.length > 0 || members.length > 0) setShowDropdown(true);
          }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder={selected.length === 0 ? 'Type @ to mention...' : ''}
          className="min-w-[120px] flex-1 border-none bg-transparent text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] focus:outline-none"
        />
      </div>

      {/* Dropdown */}
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

      {showDropdown && filtered.length === 0 && query.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-[#eee] bg-white p-3 text-center shadow-lg">
          <p className="text-[12px] text-[#999]">No members found</p>
        </div>
      )}
    </div>
  );
}

// ─── UI Components ───

function TabBtn({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-[13px] font-medium transition-colors ${
        active
          ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white'
          : 'border-[#e5e5e3] text-[#888] hover:border-[#ddd] hover:text-[#555]'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

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
