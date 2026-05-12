'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import type { Editor } from '@tiptap/react';
import { useEditorStore } from '@/stores/editor-store';
import { TiptapEditor } from '@/components/editor/tiptap-editor';
import { EditorHeader } from '@/components/editor/editor-header';
import { OutlinePanel } from '@/components/editor/outline-panel';
import { AICopilotPanel } from '@/components/editor/ai-copilot-panel';
import { AIAssistPanel } from '@/components/editor/ai-assist-panel';
import { PanelCollapsedRail } from '@/components/editor/panel-collapsed-rail';
import { HistoryView } from '@/components/editor/history-panel';
import { MarkdownView } from '@/components/editor/markdown-view';
import { BubbleToolbar } from '@/components/editor/bubble-toolbar';
import { InlineCommentPopover } from '@/components/editor/inline-comment-popover';
import { savePRDContent } from '@/components/editor/actions';
import { updateHiddenSections } from '@/app/(app)/prds/[prdId]/actions';
import { PRD_SECTION_LABELS } from '@/types/prd';
import { usePrdPresence } from '@/hooks/use-prd-presence';
import { PresenceAvatars } from '@/components/editor/presence-avatars';
import { CursorOverlay } from '@/components/editor/cursor-overlay';
import { SectionBadgeOverlay } from '@/components/editor/section-badge';

// Invert labels → keys for section detection
const LABEL_TO_KEY = Object.fromEntries(
  Object.entries(PRD_SECTION_LABELS).map(([k, v]) => [v.toLowerCase(), k]),
);

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
    hidden_sections: string[] | null;
  };
  userName: string;
  userEmail?: string;
  userAvatar?: string | null;
  userId?: string;
  workspaceId?: string;
  aiProviders?: { id: string; display_name: string; default_model: string }[];
  canChangeStatus?: boolean;
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
  userEmail,
  userAvatar,
  userId,
  workspaceId: _workspaceId,
  aiProviders,
  canChangeStatus,
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
    collapseAllPanels,
    setCurrentSection,
  } = useEditorStore();

  // Auto-collapse panels on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      collapseAllPanels();
    }
  }, [collapseAllPanels]);

  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [historyMode, setHistoryMode] = useState(false);
  const [hiddenSections, setHiddenSections] = useState<string[]>(prd.hidden_sections ?? []);
  const [liveWordCount, setLiveWordCount] = useState(prd.word_count);
  const [liveReadTime, setLiveReadTime] = useState(prd.read_time_minutes);

  // Recalculate word count on every editor content change
  useEffect(() => {
    if (!editorInstance) return;

    function recalcStats() {
      if (!editorInstance || editorInstance.isDestroyed) return;
      const text = editorInstance.state.doc.textContent;
      const words = text.split(/\s+/).filter((w: string) => w.length > 0).length;
      setLiveWordCount(words);
      setLiveReadTime(Math.max(1, Math.round(words / 200)));
    }

    // Calculate on mount
    recalcStats();

    // Re-calculate on every content update
    editorInstance.on('update', recalcStats);
    return () => {
      editorInstance.off('update', recalcStats);
    };
  }, [editorInstance]);

  const handleToggleSection = useCallback(
    (sectionKey: string) => {
      setHiddenSections((prev) => {
        const next = prev.includes(sectionKey)
          ? prev.filter((s) => s !== sectionKey)
          : [...prev, sectionKey];
        // Defer server action to avoid setState-during-render
        setTimeout(() => updateHiddenSections(prd.id, next), 0);
        return next;
      });
    },
    [prd.id],
  );

  const toggleHistory = useCallback(() => {
    setHistoryMode((prev) => !prev);
  }, []);

  const handleEditorReady = useCallback((editor: Editor | null) => {
    setEditorInstance(editor);
  }, []);

  // Bubble toolbar: AI Assist button handler
  const handleBubbleAIAssist = useCallback(
    (text: string, range: { from: number; to: number }) => {
      openAIAssist(text, range);
      // Detect which PRD section the cursor is in
      if (editorInstance) {
        let sectionKey = 'unknown';
        editorInstance.state.doc.descendants((node, pos) => {
          if (node.type.name === 'heading' && node.attrs.level === 2 && pos < range.from) {
            const headingText = node.textContent.toLowerCase();
            if (LABEL_TO_KEY[headingText]) {
              sectionKey = LABEL_TO_KEY[headingText];
            }
          }
        });
        setCurrentSection(sectionKey);
      }
    },
    [openAIAssist, editorInstance, setCurrentSection],
  );

  // Bubble toolbar: Comment button handler — trigger InlineCommentPopover
  const [commentTrigger, setCommentTrigger] = useState(0);
  const handleBubbleComment = useCallback(() => {
    // Increment trigger to tell InlineCommentPopover to open its input
    setCommentTrigger((prev) => prev + 1);
  }, []);

  const router = useRouter();

  // Collaboration presence
  const presenceCurrentUser = userId
    ? { id: userId, name: userName, email: userEmail, avatar: userAvatar ?? null }
    : null;
  const {
    onlineUsers,
    broadcastCursor,
    broadcastSection,
    broadcastContentSaved,
    clearContentUpdate,
    contentUpdatedBy,
  } = usePrdPresence(prd.id, presenceCurrentUser);

  // Track whether user is actively typing (for smart refresh logic)
  const isTypingRef = useRef(false);
  const [isTypingState, setIsTypingState] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentUpdatedByRef = useRef<string | null>(null);
  contentUpdatedByRef.current = contentUpdatedBy;

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle' | 'error'>('idle');
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasUnsavedEditsRef = useRef(false);

  // Create a version snapshot (fire-and-forget)
  const createVersionSnapshot = useCallback(async () => {
    try {
      await fetch(`/api/prd/${prd.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: 'Auto-saved', source: 'auto_save' }),
      });
      hasUnsavedEditsRef.current = false;
    } catch {
      /* ignore */
    }
  }, [prd.id]);

  // Schedule version on idle (10s after last edit)
  const scheduleIdleVersion = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    hasUnsavedEditsRef.current = true;
    idleTimerRef.current = setTimeout(() => {
      createVersionSnapshot();
    }, 3000); // 3 seconds idle
  }, [createVersionSnapshot]);

  // Interval version: every 5 minutes during active editing
  useEffect(() => {
    intervalTimerRef.current = setInterval(() => {
      if (hasUnsavedEditsRef.current) {
        createVersionSnapshot();
      }
    }, 300000); // 5 minutes

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
    };
  }, [createVersionSnapshot]);

  const handleUpdate = useCallback(
    (content: Record<string, unknown>) => {
      setSaveStatus('saving');
      savePRDContent(prd.id, content)
        .then((result) => {
          if (result.ok) {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
            scheduleIdleVersion();
            broadcastContentSaved();
          } else {
            setSaveStatus('error');
          }
        })
        .catch(() => {
          setSaveStatus('error');
        });
    },
    [prd.id, scheduleIdleVersion, broadcastContentSaved],
  );

  const handleInsert = useCallback(
    (text: string) => {
      if (editorInstance) {
        const range = useEditorStore.getState().aiAssistSelectionRange;

        // Convert plain text to HTML paragraphs for proper Tiptap insertion
        const html = text
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => `<p>${line}</p>`)
          .join('');

        if (range) {
          const docSize = editorInstance.state.doc.content.size;
          const from = Math.min(range.from, docSize);
          const to = Math.min(range.to, docSize);
          editorInstance
            .chain()
            .focus()
            .insertContentAt({ from, to }, html, { parseOptions: { preserveWhitespace: false } })
            .run();
        } else {
          editorInstance.chain().focus().insertContent(html).run();
        }

        // Force immediate save + version snapshot
        const content = editorInstance.getJSON() as Record<string, unknown>;
        setSaveStatus('saving');
        savePRDContent(prd.id, content)
          .then((result) => {
            if (result.ok) {
              setSaveStatus('saved');
              setTimeout(() => setSaveStatus('idle'), 2000);
              createVersionSnapshot();
              broadcastContentSaved();
            }
          })
          .catch(() => {
            setSaveStatus('error');
          });
      }
      closeAIAssist();
    },
    [editorInstance, closeAIAssist, prd.id, createVersionSnapshot, broadcastContentSaved],
  );

  const handleMarkdownChange = useCallback(
    (text: string) => {
      if (!editorInstance) return;
      const html = marked.parse(text, { async: false }) as string;
      editorInstance.commands.setContent(html);
      handleUpdate(editorInstance.getJSON() as Record<string, unknown>);
    },
    [editorInstance, handleUpdate],
  );

  const handleCommentClick = useCallback(
    (_commentId: string, range: { from: number; to: number }) => {
      if (!editorInstance) return;
      try {
        // Select the commented range to scroll it into view
        editorInstance.chain().focus().setTextSelection(range).run();

        // Scroll the selection into view
        const coords = editorInstance.view.coordsAtPos(range.from);
        const editorEl = editorInstance.view.dom.closest('.tiptap-editor')?.parentElement;
        const scrollContainer = editorEl?.closest('.overflow-y-auto');
        if (scrollContainer && coords) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const scrollTop = scrollContainer.scrollTop + (coords.top - containerRect.top) - 100;
          scrollContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }
      } catch {
        // Range may no longer be valid if content changed
      }
    },
    [editorInstance],
  );

  const handleCommentAdded = useCallback(() => {
    // Trigger a save so the comment marks are persisted in tiptap_content
    if (editorInstance) {
      handleUpdate(editorInstance.getJSON() as Record<string, unknown>);
    }
  }, [editorInstance, handleUpdate]);

  // Broadcast cursor position and active section to other collaborators
  useEffect(() => {
    if (!editorInstance || !userId) return;

    const handleSelectionUpdate = () => {
      const { from } = editorInstance.state.selection;
      try {
        const coords = editorInstance.view.coordsAtPos(from);
        const editorRect = editorInstance.view.dom.getBoundingClientRect();
        broadcastCursor(coords.left - editorRect.left, coords.top - editorRect.top);
      } catch {
        /* position may be invalid on content reset */
      }

      let activeSection = '';
      editorInstance.state.doc.nodesBetween(0, from, (node) => {
        if (node.type.name === 'heading') {
          activeSection = node.textContent;
        }
      });
      if (activeSection) broadcastSection(activeSection);
    };

    editorInstance.on('selectionUpdate', handleSelectionUpdate);
    return () => {
      editorInstance.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editorInstance, userId, broadcastCursor, broadcastSection]);

  // Track typing state for smart content-sync refresh
  useEffect(() => {
    if (!editorInstance) return;
    const handleTyping = () => {
      isTypingRef.current = true;
      setIsTypingState(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        setIsTypingState(false);
        // If a remote save arrived while we were typing, refresh now that we're idle
        if (contentUpdatedByRef.current) {
          router.refresh();
          clearContentUpdate();
        }
      }, 2000);
    };
    editorInstance.on('update', handleTyping);
    return () => {
      editorInstance.off('update', handleTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [editorInstance, router, clearContentUpdate]);

  // Auto-refresh when remote save arrives and we're idle
  useEffect(() => {
    if (!contentUpdatedBy) return;
    if (!isTypingRef.current) {
      router.refresh();
      clearContentUpdate();
    }
  }, [contentUpdatedBy, router, clearContentUpdate]);

  const editorContent = prd.tiptap_content ?? prd.content;

  const savedAgo = useMemo(() => formatRelativeTime(prd.updated_at), [prd.updated_at]);

  // Full-page history mode — replaces entire editor
  if (historyMode) {
    return (
      <HistoryView
        prdId={prd.id}
        currentContent={prd.tiptap_content}
        onClose={() => setHistoryMode(false)}
        onRestore={() => {
          setHistoryMode(false);
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg-canvas">
      {/* Left panel */}
      {outlineCollapsed ? (
        <PanelCollapsedRail
          side="left"
          onExpand={(tab) => expandOutline(tab as 'outline' | 'comments' | 'info' | undefined)}
        />
      ) : (
        <OutlinePanel
          prd={{ ...prd, word_count: liveWordCount, read_time_minutes: liveReadTime }}
          userId={userId}
          editorInstance={editorInstance}
          hiddenSections={hiddenSections}
          onToggleSection={handleToggleSection}
          onCommentClick={handleCommentClick}
        />
      )}

      {/* Main editor area — Word/Google Docs style */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="editor-scroll-area flex-1 overflow-y-auto bg-[#f0efed]">
          {/* Paper */}
          <div
            className="mx-auto my-8 w-full max-w-[680px] rounded-sm bg-white px-12 py-10 shadow-sm"
            style={{ minHeight: '900px' }}
          >
            <EditorHeader
              prd={prd}
              userName={userName}
              canChangeStatus={canChangeStatus}
              onToggleHistory={toggleHistory}
            />
            {markdownMode ? (
              <MarkdownView content={editorContent} onChange={handleMarkdownChange} />
            ) : (
              <div className="relative">
                <TiptapEditor
                  content={editorContent}
                  onUpdate={handleUpdate}
                  editable
                  hiddenSections={hiddenSections}
                  sectionLabelToKey={LABEL_TO_KEY}
                  onEditorReady={handleEditorReady}
                />
                {editorInstance && (
                  <>
                    <BubbleToolbar
                      editor={editorInstance}
                      onAIAssist={handleBubbleAIAssist}
                      onComment={handleBubbleComment}
                    />
                    <InlineCommentPopover
                      editor={editorInstance}
                      prdId={prd.id}
                      commentTrigger={commentTrigger}
                      onCommentAdded={handleCommentAdded}
                    />
                    {userId && (
                      <>
                        <CursorOverlay users={onlineUsers} currentUserId={userId} />
                        <SectionBadgeOverlay
                          editor={editorInstance}
                          users={onlineUsers}
                          currentUserId={userId}
                        />
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer bar — save status only */}
        <div className="flex shrink-0 items-center gap-4 border-t border-subtle bg-white px-8 py-2 font-mono text-[11px] text-ink-tertiary">
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
            ) : saveStatus === 'error' ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                <span className="text-red-500">Save failed</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-ink-quaternary" />
                Saved {savedAgo}
              </>
            )}
          </span>
          <div className="ml-auto flex items-center gap-3">
            {userId && <PresenceAvatars users={onlineUsers} currentUserId={userId} />}
            <button
              type="button"
              className="rounded px-2 py-0.5 text-ink-tertiary transition-colors hover:bg-bg-elevated hover:text-ink-primary"
              onClick={() => setMarkdownMode(!markdownMode)}
            >
              {markdownMode ? 'Rich Editor' : 'Markdown'}
            </button>
          </div>
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
          providers={aiProviders}
        />
      ) : (
        <AICopilotPanel prdId={prd.id} userName={userName} serverProviders={aiProviders} />
      )}

      {/* Remote-save notification — shown when actively typing and a collaborator saved */}
      {contentUpdatedBy && isTypingState && (
        <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#1a1a1a] px-5 py-2.5 text-[13px] text-white shadow-xl">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
          <span>{contentUpdatedBy} saved changes</span>
          <button
            type="button"
            onClick={() => {
              router.refresh();
              clearContentUpdate();
            }}
            className="text-[13px] font-medium text-blue-300 underline underline-offset-2 transition-colors hover:text-blue-200"
          >
            Update now
          </button>
        </div>
      )}
    </div>
  );
}
