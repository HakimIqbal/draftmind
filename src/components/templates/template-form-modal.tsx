'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRD_SECTION_KEYS, PRD_SECTION_LABELS, PRD_SECTION_DESCRIPTIONS } from '@/types/prd';
import type { PRDSectionKey } from '@/types/prd';
import {
  createTemplate,
  updateTemplate,
  type TemplateFormData,
} from '@/app/(app)/templates/actions';
import type { Template } from '@/app/(app)/templates/page';

const CATEGORY_OPTIONS = [
  { value: 'feature', label: 'Feature' },
  { value: 'experiment', label: 'Experiment' },
  { value: 'rfc', label: 'RFC' },
  { value: 'one-pager', label: 'One-pager' },
  { value: 'research', label: 'Research' },
  { value: 'custom', label: 'Custom' },
];

interface TemplateFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Template | null;
}

function parseTemplateSections(template?: Template | null): {
  sections: string[];
  guidelines: Record<string, string>;
} {
  if (!template?.structure) {
    return {
      sections: [...PRD_SECTION_KEYS],
      guidelines: {},
    };
  }

  const structure = template.structure as {
    sections?: Array<{ name: string; guidelines?: string }>;
  };

  if (!structure.sections?.length) {
    return {
      sections: [...PRD_SECTION_KEYS],
      guidelines: {},
    };
  }

  const sections = structure.sections.map((s) => s.name);
  const guidelines: Record<string, string> = {};
  for (const s of structure.sections) {
    if (s.guidelines) guidelines[s.name] = s.guidelines;
  }
  return { sections, guidelines };
}

export function TemplateFormModal({ open, onOpenChange, template }: TemplateFormModalProps) {
  const isEdit = !!template;
  const parsed = parseTemplateSections(template);

  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [category, setCategory] = useState(template?.category ?? 'custom');
  const [selectedSections, setSelectedSections] = useState<string[]>(parsed.sections);
  const [guidelines, setGuidelines] = useState<Record<string, string>>(parsed.guidelines);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    setName('');
    setDescription('');
    setCategory('custom');
    setSelectedSections([...PRD_SECTION_KEYS]);
    setGuidelines({});
    setExpandedSection(null);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) reset();
      onOpenChange(next);
    },
    [onOpenChange, reset],
  );

  const toggleSection = useCallback((key: string) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
    );
  }, []);

  const handleGuidelineChange = useCallback((key: string, value: string) => {
    setGuidelines((prev) => ({ ...prev, [key]: value }));
  }, []);

  async function handleSubmit() {
    if (!name.trim()) return;
    if (selectedSections.length === 0) {
      toast.error('Select at least one section');
      return;
    }

    setSaving(true);
    const data: TemplateFormData = {
      name: name.trim(),
      description: description.trim(),
      category,
      sections: selectedSections,
      guidelines,
    };

    try {
      const result = isEdit ? await updateTemplate(template!.id, data) : await createTemplate(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(isEdit ? 'Template updated' : 'Template created');
      handleOpenChange(false);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit template' : 'Create template'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update your custom template structure.'
              : 'Define a reusable PRD structure for your team.'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {/* Name */}
          <div>
            <label className="mb-xs block font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
              Template name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Feature PRD"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-xs block font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="When to use this template"
              rows={2}
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-xs block font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Section picker */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                Sections ({selectedSections.length}/{PRD_SECTION_KEYS.length})
              </label>
              <button
                type="button"
                onClick={() =>
                  setSelectedSections(
                    selectedSections.length === PRD_SECTION_KEYS.length
                      ? []
                      : [...PRD_SECTION_KEYS],
                  )
                }
                className="text-xs text-accent transition-colors hover:text-accent-deep"
              >
                {selectedSections.length === PRD_SECTION_KEYS.length
                  ? 'Deselect all'
                  : 'Select all'}
              </button>
            </div>

            <div className="space-y-1">
              {PRD_SECTION_KEYS.map((key) => {
                const label = PRD_SECTION_LABELS[key as PRDSectionKey];
                const desc = PRD_SECTION_DESCRIPTIONS[key as PRDSectionKey];
                const isSelected = selectedSections.includes(key);
                const isExpanded = expandedSection === key;

                return (
                  <div key={key} className="rounded-md border border-subtle">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleSection(key)} />
                      <button
                        type="button"
                        className="flex flex-1 items-center justify-between text-left"
                        onClick={() => setExpandedSection(isExpanded ? null : key)}
                      >
                        <div>
                          <span className="text-sm text-ink-primary">{label}</span>
                          <p className="text-xs text-ink-tertiary">{desc}</p>
                        </div>
                        <span className="text-xs text-ink-tertiary">{isExpanded ? '−' : '+'}</span>
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-subtle px-3 py-2">
                        <Textarea
                          value={guidelines[key] ?? ''}
                          onChange={(e) => handleGuidelineChange(key, e.target.value)}
                          placeholder="Optional guidelines for AI generation (e.g. 'Focus on mobile UX')"
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            className="border-accent text-accent"
            onClick={handleSubmit}
            disabled={saving || !name.trim() || selectedSections.length === 0}
          >
            {saving ? 'Saving...' : isEdit ? 'Update template' : 'Create template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
