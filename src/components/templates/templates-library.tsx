'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  FileText,
  FlaskConical,
  FileCode2,
  FileBarChart,
  Search,
  Palette,
} from 'lucide-react';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { TemplateCard } from '@/components/templates/template-card';
import { TemplateFormModal } from '@/components/templates/template-form-modal';
import type { Template } from '@/app/(app)/templates/page';

const FILTER_OPTIONS = [
  { label: 'All', value: 'all', icon: null },
  { label: 'Feature', value: 'feature', icon: FileText },
  { label: 'Experiment', value: 'experiment', icon: FlaskConical },
  { label: 'Technical Proposal', value: 'rfc', icon: FileCode2 },
  { label: 'One-pager', value: 'one-pager', icon: FileBarChart },
  { label: 'Research', value: 'research', icon: Search },
  { label: 'Custom', value: 'custom', icon: Palette },
] as const;

interface TemplatesLibraryProps {
  templates: Template[];
}

export function TemplatesLibrary({ templates }: TemplatesLibraryProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);

  const filtered =
    activeFilter === 'all' ? templates : templates.filter((t) => t.category === activeFilter);

  // Count templates per category
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: templates.length };
    for (const t of templates) {
      map[t.category] = (map[t.category] ?? 0) + 1;
    }
    return map;
  }, [templates]);

  return (
    <div className="space-y-6 p-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-ink-primary">Templates</h1>
          <p className="mt-1 text-sm text-ink-secondary">Start faster with proven structures.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} className="mr-1.5" />
          Create template
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 border-b border-subtle pb-0">
        {FILTER_OPTIONS.map((opt) => {
          const count = counts[opt.value] ?? 0;
          const Icon = opt.icon;
          return (
            <Chip
              key={opt.value}
              active={activeFilter === opt.value}
              onClick={() => setActiveFilter(opt.value)}
            >
              {Icon && <Icon size={12} className="mr-1 inline-block opacity-60" />}
              {opt.label}
              {count > 0 && <span className="ml-1 text-[10px] opacity-50">{count}</span>}
            </Chip>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-secondary">
          No templates match your filter
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={!template.is_built_in ? () => setEditTemplate(template) : undefined}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <TemplateFormModal open={createOpen} onOpenChange={setCreateOpen} />

      {/* Edit modal */}
      <TemplateFormModal
        open={!!editTemplate}
        onOpenChange={(open) => {
          if (!open) setEditTemplate(null);
        }}
        template={editTemplate}
      />
    </div>
  );
}
