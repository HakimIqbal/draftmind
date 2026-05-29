'use client';

import { useState, useMemo } from 'react';
import { Plus, FileText, Palette } from 'lucide-react';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { TemplateCard } from '@/components/templates/template-card';
import { TemplateFormModal } from '@/components/templates/template-form-modal';
import type { Template } from '@/app/(app)/templates/page';

function formatCategoryLabel(value: string) {
  return value
    .split(/[-_\s]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

interface TemplatesLibraryProps {
  templates: Template[];
  canManageTemplates: boolean;
}

export function TemplatesLibrary({ templates, canManageTemplates }: TemplatesLibraryProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);

  const filtered =
    activeFilter === 'all'
      ? templates
      : activeFilter === 'custom'
        ? templates.filter((t) => !t.is_built_in)
        : templates.filter((t) => t.category === activeFilter);

  // Build filter chips from the real template categories in DB so labels/counts stay accurate.
  const filterOptions = useMemo(() => {
    const categories = Array.from(
      new Set(
        templates
          .filter((t) => t.is_built_in)
          .map((t) => t.category)
          .filter(Boolean),
      ),
    ).sort((a, b) => formatCategoryLabel(a).localeCompare(formatCategoryLabel(b)));

    return [
      { label: 'All', value: 'all', icon: null },
      ...categories.map((category) => ({
        label: formatCategoryLabel(category),
        value: category,
        icon: FileText,
      })),
      { label: 'Custom', value: 'custom', icon: Palette },
    ];
  }, [templates]);

  // Count templates per filter
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: templates.length, custom: 0 };
    for (const t of templates) {
      if (t.is_built_in) {
        map[t.category] = (map[t.category] ?? 0) + 1;
      } else {
        map.custom = (map.custom ?? 0) + 1;
      }
    }
    return map;
  }, [templates]);

  return (
    <div className="space-y-6 px-4 py-5 pb-24 sm:p-md sm:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-ink-primary">Templates</h1>
          <p className="mt-1 text-sm text-ink-secondary">Start faster with proven structures.</p>
        </div>
        {canManageTemplates && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus size={14} className="mr-1.5" />
            Create template
          </Button>
        )}
      </div>

      {/* Filter chips */}
      <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto border-b border-subtle px-4 pb-0 sm:mx-0 sm:px-0">
        {filterOptions.map((opt) => {
          const count = counts[opt.value] ?? 0;
          const Icon = opt.icon;
          return (
            <Chip
              key={opt.value}
              active={activeFilter === opt.value}
              onClick={() => setActiveFilter(opt.value)}
              className="whitespace-nowrap"
            >
              {Icon && <Icon size={12} className="mr-1 hidden opacity-60 sm:inline-block" />}
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
              canManage={canManageTemplates}
              onEdit={
                !template.is_built_in && canManageTemplates
                  ? () => setEditTemplate(template)
                  : undefined
              }
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
