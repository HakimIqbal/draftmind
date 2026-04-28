'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useEffect, useRef, useCallback } from 'react';
import { SlashMenu, useSlashMenu } from '@/components/editor/slash-menu';

interface TiptapEditorProps {
  content: Record<string, unknown>;
  onUpdate?: (content: Record<string, unknown>) => void;
  editable?: boolean;
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void;
}

export function TiptapEditor({
  content,
  onUpdate,
  editable = true,
  onEditorReady,
}: TiptapEditorProps) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const editorReadyRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Placeholder.configure({
        placeholder: 'Start writing or type / for commands...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-accent underline' },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
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
      }, 800);
    },
  });

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Update content when prop changes (e.g. after AI generation)
  useEffect(() => {
    if (editor && content && !editor.isDestroyed) {
      const currentJSON = JSON.stringify(editor.getJSON());
      const newJSON = JSON.stringify(content);
      if (currentJSON !== newJSON) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

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
