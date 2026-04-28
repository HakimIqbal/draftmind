'use client';

import { useEffect, useMemo, useState } from 'react';
import { tiptapToPlainText } from '@/lib/prd/markdown';
import type { TiptapContent } from '@/lib/prd/schema';

export interface MarkdownViewProps {
  content: Record<string, unknown>;
  onChange: (content: string) => void;
}

export function MarkdownView({ content, onChange }: MarkdownViewProps) {
  const markdownText = useMemo(() => {
    if (
      content &&
      typeof content === 'object' &&
      content.type === 'doc' &&
      Array.isArray(content.content)
    ) {
      return tiptapToPlainText(content as unknown as TiptapContent);
    }
    return '';
  }, [content]);

  const [text, setText] = useState(markdownText);

  // Sync external content changes
  useEffect(() => {
    setText(markdownText);
  }, [markdownText]);

  return (
    <div className="min-h-[400px] rounded-md border border-subtle bg-bg-surface p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onChange(text)}
        className="min-h-[400px] w-full resize-none bg-transparent font-mono text-sm text-ink-primary outline-none"
        spellCheck={false}
        placeholder="Markdown content..."
      />
    </div>
  );
}
