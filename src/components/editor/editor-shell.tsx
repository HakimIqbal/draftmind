'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { useEditorStore } from '@/stores/editor-store';
import { TiptapEditor } from '@/components/editor/tiptap-editor';
import { EditorHeader } from '@/components/editor/editor-header';
import { OutlinePanel } from '@/components/editor/outline-panel';
import { AICopilotPanel } from '@/components/editor/ai-copilot-panel';
import { AIAssistPanel } from '@/components/editor/ai-assist-panel';
import { PanelCollapsedRail } from '@/components/editor/panel-collapsed-rail';
import { MarkdownView } from '@/components/editor/markdown-view';
import { useSelectionDetector } from '@/components/editor/selection-toolbar';
import { savePRDContent } from '@/components/editor/actions';

export interface EditorShellProps {
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
  userId?: string;
  workspaceId?: string;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function EditorShell({
  prd,
  userName,
  userId,
  workspaceId: _workspaceId,
}: EditorShellProps) {
  const {
    outlineCollapsed,
    copilotCollapsed,
    markdownMode,
    aiAssistMode,
    aiAssistSelectedText,
    expandOutline,
    expandCopilot,
    setMarkdownMode,
    openAIAssist,
    closeAIAssist,
  } = useEditorStore();

  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  const handleEditorReady = useCallback((editor: Editor | null) => {
    setEditorInstance(editor);
  }, []);

  const handleSelect = useCallback(
    (text: string) => {
      openAIAssist(text);
    },
    [openAIAssist],
  );

  const handleDeselect = useCallback(() => {
    // Don't auto-close AI assist on deselect — user may still be working with suggestions
  }, []);

  useSelectionDetector(editorInstance, handleSelect, handleDeselect);

  const handleInsert = useCallback(
    (text: string) => {
      if (editorInstance) {
        editorInstance.chain().focus().insertContent(text).run();
      }
      closeAIAssist();
    },
    [editorInstance, closeAIAssist],
  );

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

  const handleUpdate = useCallback(
    (content: Record<string, unknown>) => {
      setSaveStatus('saving');
      savePRDContent(prd.id, content).then(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      });
    },
    [prd.id],
  );

  const handleMarkdownChange = useCallback((_text: string) => {
    // Markdown → Tiptap conversion not yet supported; view-only for now
  }, []);

  const editorContent = prd.tiptap_content ?? prd.content;

  const savedAgo = useMemo(() => formatRelativeTime(prd.updated_at), [prd.updated_at]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg-canvas">
      {/* Left panel */}
      {outlineCollapsed ? (
        <PanelCollapsedRail
          side="left"
          onExpand={(tab) => expandOutline(tab as 'outline' | 'comments' | 'info' | undefined)}
        />
      ) : (
        <OutlinePanel prd={prd} userId={userId} />
      )}

      {/* Main editor area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[760px] px-8 py-8">
            <EditorHeader prd={prd} userName={userName} />
            {markdownMode ? (
              <MarkdownView content={editorContent} onChange={handleMarkdownChange} />
            ) : (
              <TiptapEditor
                content={editorContent}
                onUpdate={handleUpdate}
                editable
                onEditorReady={handleEditorReady}
              />
            )}
          </div>
        </div>

        {/* Footer bar */}
        <div className="flex shrink-0 items-center gap-4 border-t border-subtle px-8 py-2 font-mono text-[11px] text-ink-tertiary">
          <span className="flex items-center gap-1.5">
            {saveStatus === 'saving' ? (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                Saving...
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Saved
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-ink-quaternary" />
                Saved {savedAgo}
              </>
            )}
          </span>
          <span>&middot;</span>
          <span>{prd.word_count} words</span>
          <span>&middot;</span>
          <span>{prd.read_time_minutes} min read</span>
          <button
            type="button"
            className="ml-auto rounded px-2 py-0.5 text-ink-tertiary transition-colors hover:bg-bg-elevated hover:text-ink-primary"
            onClick={() => setMarkdownMode(!markdownMode)}
          >
            {markdownMode ? 'Rich Editor' : 'Markdown'}
          </button>
        </div>
      </div>

      {/* Right panel */}
      {copilotCollapsed ? (
        <PanelCollapsedRail side="right" onExpand={() => expandCopilot()} />
      ) : aiAssistMode && aiAssistSelectedText ? (
        <AIAssistPanel
          selectedText={aiAssistSelectedText}
          prdId={prd.id}
          onInsert={handleInsert}
          onClose={closeAIAssist}
        />
      ) : (
        <AICopilotPanel prdId={prd.id} />
      )}
    </div>
  );
}
