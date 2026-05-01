'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { TemplateCard } from '@/components/templates/template-card';
import { TemplateFormModal } from '@/components/templates/template-form-modal';
import type { Template } from '@/app/(app)/templates/page';

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Feature', value: 'feature' },
  { label: 'Experiment', value: 'experiment' },
  { label: 'RFC', value: 'rfc' },
  { label: 'One-pager', value: 'one-pager' },
  { label: 'Research', value: 'research' },
  { label: 'Custom', value: 'custom' },
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
      <div className="flex items-center gap-1 border-b border-subtle pb-0">
        {FILTER_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            active={activeFilter === opt.value}
            onClick={() => setActiveFilter(opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
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
