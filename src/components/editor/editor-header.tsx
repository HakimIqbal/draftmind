'use client';

import { useState } from 'react';
import Link from 'next/link';
import { History, Share2, MoreHorizontal, Save, Archive, Copy, Trash2 } from 'lucide-react';
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
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';

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

export function EditorHeader({ prd, userName, workspaceId }: EditorHeaderProps) {
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState(prd.title);
  const [templateDesc, setTemplateDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);

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
      const shareUrl = `${window.location.origin}${data.url}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard');
    } catch {
      toast.error('Failed to create share link');
    } finally {
      setSharing(false);
    }
  }

  async function handleSaveAsTemplate() {
    if (!templateName.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from('prd_templates').insert({
        workspace_id: workspaceId ?? null,
        name: templateName,
        description: templateDesc || null,
        category: 'custom',
        structure: prd.content,
        is_built_in: false,
      });
      toast.success('Template saved');
      setSaveTemplateOpen(false);
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
          <Pill status={prd.status as Parameters<typeof Pill>[0]['status']} />
          <span className="font-mono text-xs text-ink-tertiary">v{prd.current_version}</span>
          {prd.project_tag && (
            <span className="rounded-sm border border-subtle px-2 py-0.5 font-mono text-[11px] text-ink-secondary">
              {prd.project_tag}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/prds/${prd.id}/version-history`}>
              <History size={14} className="mr-1.5" />
              Version
            </Link>
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
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSaveTemplateOpen(true)}>
                <Save size={14} className="mr-2" />
                Save as template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Duplicate — coming soon')}>
                <Copy size={14} className="mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info('Archive — coming soon')}>
                <Archive size={14} className="mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-muted"
                onClick={() => toast.info('Delete — coming soon')}
              >
                <Trash2 size={14} className="mr-2" />
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
          last edit {relativeTime(prd.updated_at)} &middot; {prd.read_time_minutes} min read
        </span>
      </div>

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
