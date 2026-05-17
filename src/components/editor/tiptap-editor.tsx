'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useEffect, useRef, useCallback, useMemo } from 'react';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { CommentMark, SectionVisibility } from '@/lib/editor/extensions';

// TODO: Real-time collaborative editing (Yjs CRDT) - Post-FYP feature
// Requires: WebSocket server (e.g. Hocuspocus) running separately on VPS
// Current state: Presence-only (cursor avatar, section badge) via Supabase Realtime - already working
// To implement:
//   1. Setup Hocuspocus WebSocket server
//   2. Connect Yjs provider to WebSocket
//   3. Enable NEXT_PUBLIC_ENABLE_COLLAB env var toggle
import { SlashMenu, useSlashMenu } from '@/components/editor/slash-menu';

interface TiptapEditorProps {
  content: Record<string, unknown>;
  onUpdate?: (content: Record<string, unknown>) => void;
  editable?: boolean;
  hiddenSections?: string[];
  sectionLabelToKey?: Record<string, string>;
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void;
  collaboration?: {
    documentId: string;
    userName: string;
    userColor?: string;
  };
}

export function TiptapEditor({
  content,
  onUpdate,
  editable = true,
  hiddenSections = [],
  sectionLabelToKey = {},
  onEditorReady,
  collaboration,
}: TiptapEditorProps) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const editorReadyRef = useRef(false);

  // Create Yjs document for collaboration
  const ydoc = useMemo(() => (collaboration ? new Y.Doc() : null), [collaboration]);

  // Build collaboration extensions (local-only — provider not yet connected)
  const collabExtensions = useMemo(() => {
    if (!ydoc || !collaboration) return [];
    return [
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
        provider: null,
        user: { name: collaboration.userName, color: collaboration.userColor ?? '#6366f1' },
      }),
    ];
  }, [ydoc, collaboration]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        ...(collaboration ? { history: false } : {}),
      }),
      Placeholder.configure({
        placeholder: 'Start writing or type / for commands...',
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CommentMark,
      SectionVisibility,
      ...collabExtensions,
    ],
    content: content,
    editable,
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
    },
    onUpdate: ({ editor }) => {
      if (!onUpdate) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdate(editor.getJSON() as Record<string, unknown>);
      }, 300);
    },
  });

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Update content when prop changes (e.g. after AI generation)
  // Use ref to track initial content and only reset on genuine prop change
  const initialContentRef = useRef<string>(JSON.stringify(content));
  useEffect(() => {
    if (editor && content && !editor.isDestroyed) {
      const newJSON = JSON.stringify(content);
      // Only reset if content prop genuinely changed from initial load
      // (not from parent re-render with same props)
      if (newJSON !== initialContentRef.current) {
        initialContentRef.current = newJSON;
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  // Update section visibility storage when props change
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.storage.sectionVisibility.hiddenSections = hiddenSections;
      editor.storage.sectionVisibility.sectionLabelToKey = sectionLabelToKey;
      // Force ProseMirror to rebuild decorations
      editor.view.dispatch(editor.state.tr.setMeta('sectionVisibilityUpdate', true));
    }
  }, [editor, hiddenSections, sectionLabelToKey]);

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady && !editorReadyRef.current) {
      editorReadyRef.current = true;
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  const slashMenu = useSlashMenu(editor);

  const handleSlashClose = useCallback(() => {
    slashMenu.close();
  }, [slashMenu]);

  if (!editor) return null;

  return (
    <>
      <EditorContent editor={editor} />
      {slashMenu.open && (
        <SlashMenu
          editor={editor}
          position={slashMenu.position}
          query={slashMenu.query}
          onClose={handleSlashClose}
        />
      )}
    </>
  );
}
