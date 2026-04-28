'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Minus,
  Table2,
  Code2,
  Quote,
} from 'lucide-react';

interface SlashMenuItem {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  shortcut?: string;
  command: (editor: Editor) => void;
}

const SLASH_ITEMS: SlashMenuItem[] = [
  {
    label: 'Heading 1',
    icon: Heading1,
    shortcut: '#',
    command: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: 'Heading 2',
    icon: Heading2,
    shortcut: '##',
    command: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: 'Heading 3',
    icon: Heading3,
    shortcut: '###',
    command: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: 'Bullet list',
    icon: List,
    shortcut: '-',
    command: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: 'Numbered list',
    icon: ListOrdered,
    shortcut: '1.',
    command: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    label: 'Checklist',
    icon: CheckSquare,
    command: (e) => e.chain().focus().toggleTaskList().run(),
  },
  {
    label: 'Divider',
    icon: Minus,
    shortcut: '---',
    command: (e) => e.chain().focus().setHorizontalRule().run(),
  },
  {
    label: 'Table',
    icon: Table2,
    command: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    label: 'Code block',
    icon: Code2,
    shortcut: '```',
    command: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: 'Quote',
    icon: Quote,
    shortcut: '>',
    command: (e) => e.chain().focus().toggleBlockquote().run(),
  },
];

interface SlashMenuProps {
  editor: Editor;
  position: { top: number; left: number };
  query: string;
  onClose: () => void;
}

export function SlashMenu({ editor, position, query, onClose }: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = SLASH_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );

  const executeItem = useCallback(
    (item: SlashMenuItem) => {
      // Delete the slash and query text before executing the command
      const { from } = editor.state.selection;
      const slashStart = from - query.length - 1; // -1 for the `/` character
      editor.chain().focus().deleteRange({ from: slashStart, to: from }).run();
      item.command(editor);
      onClose();
    },
    [editor, query, onClose],
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          executeItem(filtered[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [filtered, selectedIndex, executeItem, onClose]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 max-h-[360px] max-w-[280px] overflow-auto rounded-md border border-strong bg-bg-elevated shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-2">
        <span className="font-mono text-[11px] uppercase text-ink-tertiary">Insert</span>
      </div>
      {filtered.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
              index === selectedIndex ? 'bg-bg-surface' : 'hover:bg-bg-surface'
            }`}
            onClick={() => executeItem(item)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <Icon size={16} className="shrink-0 text-ink-secondary" />
            <span className="flex-1 text-sm text-ink-primary">{item.label}</span>
            {item.shortcut && (
              <span className="font-mono text-[11px] text-ink-tertiary">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Hook to manage slash menu state in the TiptapEditor.
 * Listens for `/` typed in the editor and manages the menu lifecycle.
 */
export function useSlashMenu(editor: Editor | null) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!editor) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (!editor) return;

      if (event.key === '/' && !open) {
        // Check if the cursor is at start of line or after whitespace
        const { from } = editor.state.selection;
        const textBefore = editor.state.doc.textBetween(Math.max(0, from - 1), from, '');

        if (from === 1 || textBefore === '' || textBefore === ' ' || textBefore === '\n') {
          // Get cursor position for menu placement
          const coords = editor.view.coordsAtPos(from);
          setPosition({
            top: coords.bottom + 4,
            left: coords.left,
          });
          setQuery('');
          setOpen(true);
        }
      }
    }

    function handleUpdate() {
      if (!editor || !open) return;

      const { from } = editor.state.selection;
      // Walk back to find the `/`
      const text = editor.state.doc.textBetween(Math.max(0, from - 30), from, '');
      const slashIndex = text.lastIndexOf('/');

      if (slashIndex === -1) {
        setOpen(false);
        return;
      }

      const afterSlash = text.slice(slashIndex + 1);
      // Close if there's a space in the query (user moved on)
      if (afterSlash.includes(' ')) {
        setOpen(false);
        return;
      }

      setQuery(afterSlash);
    }

    editor.view.dom.addEventListener('keydown', handleKeyDown);
    editor.on('update', handleUpdate);

    return () => {
      editor.view.dom.removeEventListener('keydown', handleKeyDown);
      editor.off('update', handleUpdate);
    };
  }, [editor, open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  return { open, query, position, close };
}
