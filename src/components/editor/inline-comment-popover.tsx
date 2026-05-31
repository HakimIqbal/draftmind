'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addComment, type SelectionRange } from '@/components/editor/comments-actions';

interface InlineCommentPopoverProps {
  editor: Editor;
  prdId: string;
  commentTrigger?: number;
  onCommentAdded?: (commentId: string, range: SelectionRange) => void;
}

export function InlineCommentPopover({
  editor,
  prdId,
  commentTrigger,
  onCommentAdded,
}: InlineCommentPopoverProps) {
  const [showInput, setShowInput] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const selectionRef = useRef<{ from: number; to: number; text: string } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const captureSelection = useCallback(() => {
    if (!editor) return false;

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');

    if (text.length <= 3) return false;

    selectionRef.current = { from, to, text };

    // Get coordinates from the editor view
    const startCoords = editor.view.coordsAtPos(from);
    const endCoords = editor.view.coordsAtPos(to);

    // Position above the selection
    const editorEl = editor.view.dom.closest('.tiptap-editor')?.parentElement;
    if (!editorEl) return false;

    const editorRect = editorEl.getBoundingClientRect();
    const top = startCoords.top - editorRect.top - 44;
    const left = (startCoords.left + endCoords.left) / 2 - editorRect.left;

    setPosition({ top, left });
    return true;
  }, [editor]);

  // Open comment input when triggered from bubble toolbar
  useEffect(() => {
    if (!commentTrigger) return;
    if (captureSelection()) {
      setShowInput(true);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [commentTrigger, captureSelection]);

  // Close popover on click outside
  useEffect(() => {
    if (!showInput) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowInput(false);
        setBody('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInput]);

  const handleSubmit = async (e?: React.MouseEvent) => {
    e?.stopPropagation(); // prevent outside-click handler from closing popover
    const trimmed = body.trim();
    if (!trimmed || submitting || !selectionRef.current) return;

    setSubmitting(true);

    const { from, to, text } = selectionRef.current;
    const selectionRange: SelectionRange = { from, to, quotedText: text.slice(0, 200) };

    const result = await addComment(prdId, trimmed, null, selectionRange);

    if (result.id) {
      // Apply comment mark to the selected range
      editor.chain().focus().setComment(result.id).run();
      onCommentAdded?.(result.id, selectionRange);
    }

    setBody('');
    setShowInput(false);
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setShowInput(false);
      setBody('');
    }
  };

  if (!showInput) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute z-50"
      style={{ top: position.top, left: position.left, transform: 'translateX(-50%)' }}
    >
      <div className="w-72 rounded-lg border border-subtle bg-bg-surface p-3 shadow-lg">
        <div className="mb-2 rounded bg-bg-elevated px-2 py-1">
          <p className="line-clamp-2 text-[11px] italic text-ink-tertiary">
            &ldquo;{selectionRef.current?.text.slice(0, 100)}
            {(selectionRef.current?.text.length ?? 0) > 100 ? '...' : ''}&rdquo;
          </p>
        </div>
        <Textarea
          ref={textareaRef}
          rows={2}
          placeholder="Add your comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-sm"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-[10px] text-ink-quaternary">
            {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac')
              ? '\u2318'
              : 'Ctrl'}
            +Enter to submit
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowInput(false);
                setBody('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!body.trim() || submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Saving...' : 'Comment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
