'use client';

import { useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/react';

/**
 * Hook that monitors text selection in the Tiptap editor.
 * When the selection exceeds 10 characters, it calls `onSelect`
 * with the selected text. When selection is cleared, calls `onDeselect`.
 *
 * Phase 3 approach: no floating toolbar — just detect selection
 * and switch the right panel to AI Assist mode in the editor shell.
 */
export function useSelectionDetector(
  editor: Editor | null,
  onSelect: (text: string) => void,
  onDeselect: () => void,
) {
  const handleSelectionUpdate = useCallback(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');

    if (text.length > 10) {
      onSelect(text);
    } else {
      onDeselect();
    }
  }, [editor, onSelect, onDeselect]);

  useEffect(() => {
    if (!editor) return;

    editor.on('selectionUpdate', handleSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, handleSelectionUpdate]);
}
