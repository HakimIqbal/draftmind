'use client';

import { useState, useCallback } from 'react';
import {
  Download,
  Check,
  Loader2,
  FileText,
  FileCode,
  FileType,
  Hash,
  MessageSquare,
  ClipboardList,
} from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioCardGroup, RadioCardItem } from '@/components/ui/radio-card';
import { Separator } from '@/components/ui/separator';

// ── Types ──

export type ExportFormat = 'pdf' | 'docx' | 'markdown' | 'html' | 'slack' | 'jira';

interface ExportSection {
  key: string;
  label: string;
  enabled: boolean;
}

const DEFAULT_SECTIONS: ExportSection[] = [
  { key: 'overview', label: 'Overview', enabled: true },
  { key: 'problem_statement', label: 'Problem Statement', enabled: true },
  { key: 'objectives', label: 'Objectives', enabled: true },
  { key: 'darci', label: 'DARCI Matrix', enabled: true },
  { key: 'scope', label: 'Scope', enabled: true },
  { key: 'user_stories', label: 'User Stories', enabled: true },
  { key: 'functional_reqs', label: 'Functional Requirements', enabled: true },
  { key: 'nfr', label: 'Non-Functional Requirements', enabled: true },
  { key: 'success_metrics', label: 'Success Metrics', enabled: true },
  { key: 'timeline', label: 'Timeline', enabled: true },
  { key: 'risks', label: 'Risks', enabled: true },
  { key: 'references', label: 'References', enabled: true },
  { key: 'glossary', label: 'Glossary', enabled: true },
  { key: 'changelog', label: 'Changelog', enabled: true },
];

const FORMAT_OPTIONS: {
  value: ExportFormat;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  comingSoon?: boolean;
}[] = [
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'docx', label: 'DOCX', icon: FileType },
  { value: 'markdown', label: 'Markdown', icon: Hash },
  { value: 'html', label: 'HTML', icon: FileCode },
  { value: 'slack', label: 'Slack', icon: MessageSquare, comingSoon: true },
  { value: 'jira', label: 'Jira', icon: ClipboardList, comingSoon: true },
];

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prdId: string;
}

export function ExportModal({ open, onOpenChange, prdId }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [sections, setSections] = useState<ExportSection[]>(DEFAULT_SECTIONS);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleSection = useCallback((key: string) => {
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, enabled: !s.enabled } : s)));
  }, []);

  const toggleAll = useCallback((enabled: boolean) => {
    setSections((prev) => prev.map((s) => ({ ...s, enabled })));
  }, []);

  const allEnabled = sections.every((s) => s.enabled);
  const noneEnabled = sections.every((s) => !s.enabled);

  async function handleExport() {
    setExporting(true);
    setCopied(false);

    try {
      const enabledKeys = sections.filter((s) => s.enabled).map((s) => s.key);

      const res = await fetch('/api/prd/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdId, format, sections: enabledKeys }),
      });

      if (!res.ok) {
        toast.error('Export failed. Please try again.');
        return;
      }

      if (format === 'markdown') {
        const text = await res.text();
        const blob = new Blob([text], { type: 'text/markdown' });
        downloadBlob(blob, 'prd-export.md');
        return;
      }

      if (format === 'html') {
        const text = await res.text();
        const blob = new Blob([text], { type: 'text/html' });
        downloadBlob(blob, 'prd-export.html');
        return;
      }

      // Binary formats (pdf/docx)
      const blob = await res.blob();
      const ext = format === 'pdf' ? 'pdf' : 'docx';
      downloadBlob(blob, `prd-export.${ext}`);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Export PRD</DialogTitle>
          <DialogDescription>Choose format and sections to export.</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-[320px] grid-cols-[1fr_auto_1fr] gap-6">
          {/* Left: Format picker */}
          <div className="space-y-3">
            <p className="font-mono text-sm uppercase tracking-wider text-ink-tertiary">Format</p>
            <RadioCardGroup
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              {FORMAT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                if (opt.comingSoon) {
                  return (
                    <div
                      key={opt.value}
                      className="border-ink-quaternary/50 relative flex cursor-not-allowed items-center gap-2 rounded-lg border border-dashed p-2.5 opacity-50"
                    >
                      <Icon size={16} className="flex-shrink-0 text-ink-tertiary" />
                      <span className="text-sm text-ink-tertiary">{opt.label}</span>
                      <span className="bg-ink-quaternary/20 ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-tertiary">
                        Soon
                      </span>
                    </div>
                  );
                }
                return (
                  <RadioCardItem
                    key={opt.value}
                    value={opt.value}
                    className="flex items-center gap-2 p-2.5"
                  >
                    <Icon size={16} className="flex-shrink-0 text-ink-secondary" />
                    <span className="text-sm text-ink-primary">{opt.label}</span>
                  </RadioCardItem>
                );
              })}
            </RadioCardGroup>
          </div>

          <Separator orientation="vertical" />

          {/* Right: Section toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm uppercase tracking-wider text-ink-tertiary">
                Sections
              </p>
              <button
                type="button"
                onClick={() => toggleAll(!allEnabled)}
                className="text-xs text-accent transition-colors hover:text-accent-deep"
              >
                {allEnabled ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <div className="max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
              {sections.map((section) => (
                <label
                  key={section.key}
                  className="-mx-1.5 flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 transition-colors hover:bg-bg-surface"
                >
                  <Checkbox
                    checked={section.enabled}
                    onCheckedChange={() => toggleSection(section.key)}
                  />
                  <span className="text-sm text-ink-primary">{section.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary-fill"
            size="md"
            onClick={handleExport}
            disabled={exporting || noneEnabled}
          >
            {exporting ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : copied ? (
              <Check size={14} className="mr-1.5" />
            ) : (
              <Download size={14} className="mr-1.5" />
            )}
            {copied ? 'Copied!' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
