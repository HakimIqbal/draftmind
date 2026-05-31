'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { BubbleMenu, type Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  MessageSquarePlus,
  ChevronDown,
  Type,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';
import { Sparkle } from '@/components/icons/sparkle';

interface BubbleToolbarProps {
  editor: Editor;
  onAIAssist: (text: string, range: { from: number; to: number }) => void;
  onComment: () => void;
}

const HEADING_OPTIONS = [
  { level: 0, label: 'Normal Text', icon: Type },
  { level: 1, label: 'Heading 1', icon: Heading1 },
  { level: 2, label: 'Heading 2', icon: Heading2 },
  { level: 3, label: 'Heading 3', icon: Heading3 },
] as const;

const ALIGN_OPTIONS = [
  { value: 'left', icon: AlignLeft, label: 'Left' },
  { value: 'center', icon: AlignCenter, label: 'Center' },
  { value: 'right', icon: AlignRight, label: 'Right' },
  { value: 'justify', icon: AlignJustify, label: 'Justify' },
] as const;

/* ── Shared icon button ── */
function Btn({
  active,
  onClick,
  children,
  title,
  className = '',
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
        active ? 'bg-accent/10 text-accent' : 'text-[#555] hover:bg-[#f5f5f4] hover:text-[#1a1a1a]'
      } ${className}`}
      title={title}
    >
      {children}
    </button>
  );
}

/* ── Thin vertical divider ── */
function Sep() {
  return <div className="mx-1 h-4 w-px shrink-0 bg-[#e5e5e5]" />;
}

export function BubbleToolbar({ editor, onAIAssist, onComment }: BubbleToolbarProps) {
  const [headingOpen, setHeadingOpen] = useState(false);
  const [alignOpen, setAlignOpen] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkMode, setLinkMode] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);
  const alignRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!headingOpen && !alignOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (headingOpen && headingRef.current && !headingRef.current.contains(e.target as Node)) {
        setHeadingOpen(false);
      }
      if (alignOpen && alignRef.current && !alignRef.current.contains(e.target as Node)) {
        setAlignOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [headingOpen, alignOpen]);

  // Focus link input when opened
  useEffect(() => {
    if (linkMode) {
      setTimeout(() => linkInputRef.current?.focus(), 50);
      const existingHref = editor.getAttributes('link').href;
      setLinkInput(existingHref ?? '');
    }
  }, [linkMode, editor]);

  const getCurrentHeading = useCallback((): number => {
    if (editor.isActive('heading', { level: 1 })) return 1;
    if (editor.isActive('heading', { level: 2 })) return 2;
    if (editor.isActive('heading', { level: 3 })) return 3;
    return 0;
  }, [editor]);

  const getCurrentAlignment = useCallback(() => {
    if (editor.isActive({ textAlign: 'center' })) return 'center';
    if (editor.isActive({ textAlign: 'right' })) return 'right';
    if (editor.isActive({ textAlign: 'justify' })) return 'justify';
    return 'left';
  }, [editor]);

  const handleLink = useCallback(() => {
    if (linkMode) {
      let url = linkInput.trim();
      if (url) {
        if (!/^(https?:\/\/|mailto:|tel:|\/)/.test(url)) url = `https://${url}`;
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      } else {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      }
      setLinkMode(false);
      setLinkInput('');
    } else {
      setLinkMode(true);
    }
  }, [editor, linkMode, linkInput]);

  const handleAIAssist = useCallback(() => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    if (text.length > 3) {
      onAIAssist(text, { from, to });
    }
  }, [editor, onAIAssist]);

  const currentHeading = getCurrentHeading();
  const currentHeadingLabel =
    HEADING_OPTIONS.find((h) => h.level === currentHeading)?.label ?? 'Normal Text';
  const currentAlign = getCurrentAlignment();
  const CurrentAlignIcon = ALIGN_OPTIONS.find((a) => a.value === currentAlign)?.icon ?? AlignLeft;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: 'top',
        appendTo: () => document.body,
        maxWidth: 'none',
        interactive: true,
        // Pin horizontal position to the editor container's center,
        // so the toolbar doesn't shift when text alignment changes.
        getReferenceClientRect: () => {
          const { from, to } = editor.state.selection;
          const startRect = editor.view.coordsAtPos(from);
          const endRect = editor.view.coordsAtPos(to);

          // Use the editor's root element for consistent horizontal bounds
          const editorEl = editor.view.dom;
          const editorRect = editorEl.getBoundingClientRect();

          return new DOMRect(
            editorRect.left,
            Math.min(startRect.top, endRect.top) - 8,
            editorRect.width,
            0,
          );
        },
      }}
      shouldShow={({ editor: e, state }) => {
        const { from, to } = state.selection;
        const text = e.state.doc.textBetween(from, to, ' ');
        return text.length > 0 && !e.isActive('codeBlock');
      }}
    >
      <div
        className="flex max-w-[calc(100vw-1rem)] items-center overflow-x-auto rounded-lg border border-[#e5e5e5] bg-white px-1 py-0.5 shadow-[0_2px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]"
        style={{ whiteSpace: 'nowrap' }}
      >
        {linkMode ? (
          /* ── Link input mode ── */
          <div className="flex items-center gap-1.5 px-1.5 py-0.5">
            <Link2 size={13} className="shrink-0 text-[#999]" />
            <input
              ref={linkInputRef}
              type="url"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLink();
                }
                if (e.key === 'Escape') {
                  setLinkMode(false);
                  setLinkInput('');
                }
              }}
              placeholder="Paste link..."
              className="h-7 w-40 bg-transparent text-[12px] text-[#1a1a1a] placeholder:text-[#bbb] focus:outline-none"
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleLink();
              }}
              className="shrink-0 rounded-md bg-accent px-2 py-1 text-[11px] font-medium text-white hover:bg-accent-deep"
            >
              {linkInput.trim() ? 'Apply' : 'Remove'}
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setLinkMode(false);
                setLinkInput('');
              }}
              className="shrink-0 px-1.5 py-1 text-[11px] text-[#999] hover:text-[#555]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            {/* ── Heading dropdown ── */}
            <div ref={headingRef} className="relative">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setHeadingOpen(!headingOpen);
                  setAlignOpen(false);
                }}
                className={`flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-medium transition-colors ${
                  headingOpen
                    ? 'bg-accent/10 text-accent'
                    : 'text-[#555] hover:bg-[#f5f5f4] hover:text-[#1a1a1a]'
                }`}
                title="Text style"
              >
                <span>{currentHeadingLabel}</span>
                <ChevronDown
                  size={10}
                  className={`transition-transform ${headingOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {headingOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-[#e5e5e5] bg-white py-0.5 shadow-lg">
                  {HEADING_OPTIONS.map(({ level, label, icon: Icon }) => (
                    <button
                      key={level}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        let ok = false;
                        if (level === 0) {
                          ok = editor.chain().focus().setParagraph().run();
                          // Fallback: unwrap list/heading-like nodes back to a plain paragraph.
                          if (!ok) {
                            ok = editor.chain().focus().clearNodes().setParagraph().run();
                          }
                        } else {
                          ok = editor
                            .chain()
                            .focus()
                            .setNode('heading', { level: level as 1 | 2 | 3 })
                            .run();
                          // Fallback: some selections (e.g. list items) block setNode
                          if (!ok) {
                            ok = editor
                              .chain()
                              .focus()
                              .clearNodes()
                              .setNode('heading', { level: level as 1 | 2 | 3 })
                              .run();
                          }
                        }
                        setHeadingOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-[12px] transition-colors hover:bg-[#f5f5f4] ${
                        currentHeading === level ? 'font-medium text-accent' : 'text-[#555]'
                      }`}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Sep />

            {/* ── Formatting ── */}
            <Btn
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold (Cmd+B)"
            >
              <Bold size={14} strokeWidth={2.5} />
            </Btn>
            <Btn
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic (Cmd+I)"
            >
              <Italic size={14} />
            </Btn>
            <Btn
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Strikethrough"
            >
              <Strikethrough size={14} />
            </Btn>
            <Btn
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Underline (Cmd+U)"
            >
              <Underline size={14} />
            </Btn>
            <Btn active={editor.isActive('link')} onClick={handleLink} title="Link (Cmd+K)">
              <Link2 size={14} />
            </Btn>

            <Sep />

            {/* ── Align dropdown ── */}
            <div ref={alignRef} className="relative">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setAlignOpen(!alignOpen);
                  setHeadingOpen(false);
                }}
                className={`flex h-7 items-center gap-0.5 rounded-md px-1.5 transition-colors ${
                  alignOpen
                    ? 'bg-accent/10 text-accent'
                    : 'text-[#555] hover:bg-[#f5f5f4] hover:text-[#1a1a1a]'
                }`}
                title="Text alignment"
              >
                <CurrentAlignIcon size={14} />
                <ChevronDown
                  size={9}
                  className={`transition-transform ${alignOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {alignOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 overflow-hidden rounded-lg border border-[#e5e5e5] bg-white py-0.5 shadow-lg">
                  {ALIGN_OPTIONS.map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().setTextAlign(value).run();
                        setAlignOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-[12px] transition-colors hover:bg-[#f5f5f4] ${
                        currentAlign === value ? 'font-medium text-accent' : 'text-[#555]'
                      }`}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Sep />

            {/* ── Comment ── */}
            <Btn active={false} onClick={onComment} title="Add comment">
              <MessageSquarePlus size={14} />
            </Btn>

            <Sep />

            {/* ── AI Assist ── */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleAIAssist();
              }}
              className="bg-accent/8 hover:bg-accent/15 ml-0.5 flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-accent transition-colors"
              title="AI Assist"
            >
              <Sparkle size={12} />
              <span className="whitespace-nowrap">AI Assist</span>
            </button>
          </>
        )}
      </div>
    </BubbleMenu>
  );
}
