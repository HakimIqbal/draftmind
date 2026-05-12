'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  History,
  Share2,
  MoreHorizontal,
  Save,
  Copy,
  Trash2,
  Download,
  Check,
  Link2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { duplicatePRD, deletePRD, updatePRDStatus } from '@/app/(app)/prds/[prdId]/actions';
import { createTemplate } from '@/app/(app)/templates/actions';

const PRD_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In Review' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'refined', label: 'Refined' },
  { value: 'approved', label: 'Approved' },
  { value: 'final', label: 'Final' },
] as const;

interface EditorHeaderProps {
  prd: {
    id: string;
    title: string;
    project_tag: string | null;
    status: string;
    current_version: number;
    health_score: number | null;
    health_breakdown: Record<string, number> | null;
    word_count: number;
    read_time_minutes: number;
    content: Record<string, unknown>;
    tiptap_content: Record<string, unknown> | null;
    updated_at: string;
  };
  userName: string;
  workspaceId?: string;
  canChangeStatus?: boolean;
  onToggleHistory?: () => void;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function EditorHeader({
  prd,
  userName,
  workspaceId: _workspaceId,
  canChangeStatus,
  onToggleHistory,
}: EditorHeaderProps) {
  const router = useRouter();
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateName, setTemplateName] = useState(prd.title);
  const [templateDesc, setTemplateDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState('');
  const [currentStatus, setCurrentStatus] = useState(prd.status);
  const [statusUpdating, setStatusUpdating] = useState(false);

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus || statusUpdating) return;
    setStatusUpdating(true);
    const prev = currentStatus;
    setCurrentStatus(newStatus);
    const result = await updatePRDStatus(prd.id, newStatus);
    if (result.error) {
      toast.error(result.error);
      setCurrentStatus(prev);
    } else {
      toast.success(
        `Status changed to ${PRD_STATUSES.find((s) => s.value === newStatus)?.label ?? newStatus}`,
      );
    }
    setStatusUpdating(false);
  }

  async function handleDuplicate() {
    const result = await duplicatePRD(prd.id);
    if (result.error) {
      toast.error(result.error);
    } else if (result.id) {
      toast.success('PRD duplicated');
      router.push(`/prds/${result.id}`);
    }
  }

  async function handleDelete() {
    await deletePRD(prd.id);
  }

  async function handleShare() {
    setSharing(true);
    try {
      const res = await fetch(`/api/prd/${prd.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('Failed to create share link');
      const data = await res.json();
      const url = `${window.location.origin}${data.url}`;
      setShareUrl(url);
      setShareDialogOpen(true);
      setCopied(false);
    } catch {
      toast.error('Failed to create share link');
    } finally {
      setSharing(false);
    }
  }

  async function copyShareUrl() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleExport(format: string) {
    setExporting(format);
    try {
      const res = await fetch('/api/prd/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prdId: prd.id, format }),
      });
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'markdown' ? 'md' : format;
      a.download = `${prd.title.replace(/[^a-zA-Z0-9]/g, '-')}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
      setExportOpen(false);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting('');
    }
  }

  async function handleSaveAsTemplate() {
    if (!templateName.trim()) return;
    setSaving(true);
    try {
      const result = await createTemplate({
        name: templateName,
        description: templateDesc,
        category: 'custom',
        sections: Object.keys((prd.content as Record<string, unknown>).sections ?? {}),
        guidelines: {},
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Template saved');
        setSaveTemplateOpen(false);
      }
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {canChangeStatus ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="cursor-pointer focus:outline-none" disabled={statusUpdating}>
                  <Pill status={currentStatus as Parameters<typeof Pill>[0]['status']} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[160px]">
                {PRD_STATUSES.map((s) => (
                  <DropdownMenuItem
                    key={s.value}
                    onClick={() => handleStatusChange(s.value)}
                    className={currentStatus === s.value ? 'bg-[#f5f5f4] font-medium' : ''}
                  >
                    <Pill status={s.value as Parameters<typeof Pill>[0]['status']} />
                    {currentStatus === s.value && (
                      <Check size={12} className="ml-auto text-accent" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Pill status={currentStatus as Parameters<typeof Pill>[0]['status']} />
          )}
          {prd.project_tag && (
            <span className="rounded-sm border border-subtle px-2 py-0.5 font-mono text-[11px] text-ink-secondary">
              {prd.project_tag}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onToggleHistory}>
            <History size={14} className="mr-1.5" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare} disabled={sharing}>
            <Share2 size={14} className="mr-1.5" />
            {sharing ? 'Sharing...' : 'Share'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="px-1.5">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem onClick={() => router.push(`/prds/${prd.id}/ai-review`)}>
                <Sparkles size={14} />
                AI Review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExportOpen(true)}>
                <Download size={14} />
                Download / Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSaveTemplateOpen(true)}>
                <Save size={14} />
                Save as template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy size={14} />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500" onClick={() => setDeleteConfirmOpen(true)}>
                <Trash2 size={14} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <h1 className="font-display text-2xl font-bold text-ink-primary">{prd.title}</h1>

      <div className="flex items-center gap-2">
        <Avatar name={userName} size="sm" />
        <span className="font-mono text-[11px] text-ink-tertiary">
          last edit {relativeTime(prd.updated_at)}
        </span>
      </div>

      {/* Delete confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete PRD</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{prd.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-red-muted text-red-muted"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Share this PRD</DialogTitle>
            <DialogDescription>
              Anyone with the link can view a read-only version of this document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-md">
            <div className="flex items-center gap-2 rounded-lg border border-subtle bg-bg-surface px-3 py-2">
              <Link2 size={14} className="shrink-0 text-ink-tertiary" />
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent font-mono text-[12px] text-ink-secondary outline-none"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button variant="outline" size="sm" onClick={copyShareUrl}>
                {copied ? (
                  <>
                    <Check size={14} className="mr-1.5 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-1.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Download / Export</DialogTitle>
            <DialogDescription>Choose a format to download this PRD.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {[
              { format: 'markdown', label: 'Markdown', ext: '.md' },
              { format: 'html', label: 'HTML', ext: '.html' },
              { format: 'pdf', label: 'PDF', ext: '.pdf' },
              { format: 'docx', label: 'Word', ext: '.docx' },
              { format: 'slack', label: 'Slack', ext: '.txt' },
              { format: 'jira', label: 'Jira', ext: '.txt' },
            ].map((opt) => (
              <button
                key={opt.format}
                onClick={() => handleExport(opt.format)}
                disabled={!!exporting}
                className="flex items-center gap-2.5 rounded-lg border border-[#eee] px-4 py-3 text-left text-[13px] font-medium text-[#1a1a1a] transition-colors hover:border-[#ccc] hover:bg-[#fafaf9] disabled:opacity-50"
              >
                <Download size={14} className="text-[#999]" />
                <div>
                  <p>{opt.label}</p>
                  <p className="text-[11px] font-normal text-[#999]">{opt.ext}</p>
                </div>
                {exporting === opt.format && (
                  <span className="ml-auto h-3 w-3 animate-spin rounded-full border-2 border-[#ccc] border-t-accent" />
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Save as template</DialogTitle>
          </DialogHeader>
          <div className="space-y-md">
            <div>
              <label className="mb-xs block font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                Template name
              </label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Feature PRD"
              />
            </div>
            <div>
              <label className="mb-xs block font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                Description (optional)
              </label>
              <Textarea
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                placeholder="Brief description of when to use this template"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveTemplateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-accent text-accent"
              onClick={handleSaveAsTemplate}
              disabled={saving || !templateName.trim()}
            >
              {saving ? 'Saving...' : 'Save template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
