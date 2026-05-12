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
import {
  createPRDAndGenerate,
  getTemplates,
  getWorkspaceMembers,
} from '@/app/(app)/prds/new/actions';

interface GenerateFormProps {
  userId: string;
  workspaceId: string;
  userName: string;
  initialBrief: string;
  providers?: { id: string; display_name: string; default_model: string }[];
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
  providers,
}: GenerateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Template
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
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
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState(providers?.[0]?.id ?? '');

  const wordCount = brief.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    async function load() {
      const [t, m] = await Promise.all([getTemplates(), getWorkspaceMembers(workspaceId)]);
      setTemplates(t);
      setMembers(m);
    }
    load();
  }, [workspaceId]);

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
      } catch {
        showError('Failed to create PRD. Please try again.');
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
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
        <div className="relative" ref={dropdownRef}>
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
            <div className="grid grid-cols-2 gap-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreviewTemplate(null)} />
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <button
              onClick={() => setPreviewTemplate(null)}
              className="absolute right-4 top-4 text-[#bbb] hover:text-[#666]"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
              Template Preview
            </p>
            <h2 className="mt-1 text-[20px] font-bold text-[#1a1a1a]">{previewTemplate.name}</h2>
            {previewTemplate.description && (
              <p className="mt-2 text-[13px] leading-relaxed text-[#888]">
                {previewTemplate.description}
              </p>
            )}

            {/* Instructions */}
            {previewTemplate.structure.instructions && (
              <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3">
                <p className="text-[11px] font-semibold text-amber-700">Instructions for AI</p>
                <p className="mt-1 text-[12px] leading-relaxed text-amber-800/80">
                  {previewTemplate.structure.instructions}
                </p>
              </div>
            )}

            {/* Sections */}
            {previewTemplate.structure.sections && previewTemplate.structure.sections.length > 0 ? (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#aaa]">
                    Sections
                  </p>
                  <p className="text-[11px] text-[#bbb]">
                    {previewTemplate.structure.sections.length} sections
                  </p>
                </div>
                <div className="space-y-3">
                  {previewTemplate.structure.sections.map((s, i) => (
                    <div key={i} className="rounded-lg border border-[#eee] bg-[#fafaf9] p-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#eee] text-[10px] font-bold text-[#999]">
                          {i + 1}
                        </span>
                        <h3 className="text-[14px] font-semibold text-[#1a1a1a]">{s.name}</h3>
                      </div>
                      {s.guidelines && (
                        <p className="mt-2 whitespace-pre-line text-[12px] leading-relaxed text-[#666]">
                          {s.guidelines}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : previewTemplate.structure.sections_enabled &&
              previewTemplate.structure.sections_enabled.length > 0 ? (
              <div className="mt-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#aaa]">
                  Sections ({previewTemplate.structure.sections_enabled.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {previewTemplate.structure.sections_enabled.map((s, i) => (
                    <span
                      key={i}
                      className="rounded-lg border border-[#eee] bg-[#fafaf9] px-3 py-1.5 text-[12px] font-medium text-[#555]"
                    >
                      {s.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Use template button */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="h-9 rounded-lg border border-[#e5e5e3] bg-white px-4 text-[13px] font-medium text-[#666] hover:border-[#ddd]"
              >
                Close
              </button>
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

      {/* Submit */}
      <div className="mt-6 flex items-center justify-end gap-3">
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
          className="h-9 rounded-lg border border-[#e5e5e3] bg-white px-4 text-[13px] font-medium text-[#666] hover:border-[#ddd] hover:text-[#1a1a1a]"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="h-9 rounded-lg bg-accent px-5 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-30"
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
    setQuery(value.replace('@', ''));
    setShowDropdown(value.length > 0 || value.includes('@'));
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

      {showDropdown && filtered.length === 0 && query.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-xl border border-[#eee] bg-white p-3 text-center shadow-lg">
          <p className="text-[12px] text-[#999]">No members found</p>
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
