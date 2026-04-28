'use client';

import { Globe, Lock } from 'lucide-react';
import { prdToMarkdown } from '@/lib/prd/markdown';
import type { PRDDocument } from '@/lib/prd/schema';

interface PublicShareViewProps {
  prd: PRDDocument;
}

export function PublicShareView({ prd }: PublicShareViewProps) {
  const markdown = prdToMarkdown(prd);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-[720px] items-center justify-between px-6">
          <span className="text-sm font-bold tracking-tight text-gray-900">DraftMind</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-gray-400">
            <Globe size={12} />
            Public
            <span className="mx-1 text-gray-200">|</span>
            <Lock size={12} />
            Read only
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[720px] px-6 py-10">
        {/* Title */}
        <h1 className="mb-2 font-display text-3xl font-bold text-gray-900">{prd.metadata.title}</h1>

        {/* Metadata */}
        {(prd.metadata.project_tag || prd.metadata.start_date || prd.metadata.end_date) && (
          <div className="mb-8 flex flex-wrap gap-3 text-sm text-gray-500">
            {prd.metadata.project_tag && (
              <span className="inline-flex items-center rounded bg-gray-50 px-2 py-0.5 font-mono text-xs">
                {prd.metadata.project_tag}
              </span>
            )}
            {(prd.metadata.start_date || prd.metadata.end_date) && (
              <span className="font-mono text-xs">
                {[prd.metadata.start_date, prd.metadata.end_date].filter(Boolean).join(' — ')}
              </span>
            )}
          </div>
        )}

        {/* Rendered markdown content */}
        <article className="prose-share">
          <MarkdownRenderer content={markdown} />
        </article>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-[720px] border-t border-gray-100 px-6 py-8">
        <p className="text-center text-xs text-gray-400">Generated with DraftMind</p>
      </footer>

      {/* Scoped styles for the rendered content */}
      <style>{`
        .prose-share h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111;
          margin-top: 2em;
          margin-bottom: 0.5em;
          padding-bottom: 0.3em;
          border-bottom: 1px solid #f0f0f0;
        }
        .prose-share h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111;
          margin-top: 1.5em;
          margin-bottom: 0.4em;
        }
        .prose-share h3 {
          font-size: 1.05rem;
          font-weight: 600;
          color: #333;
          margin-top: 1.2em;
          margin-bottom: 0.3em;
        }
        .prose-share p {
          margin: 0.5em 0;
          line-height: 1.7;
          color: #374151;
        }
        .prose-share ul, .prose-share ol {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }
        .prose-share li {
          margin: 0.2em 0;
          line-height: 1.6;
          color: #374151;
        }
        .prose-share strong {
          font-weight: 600;
          color: #111;
        }
        .prose-share em {
          font-style: italic;
        }
        .prose-share code {
          background: #f5f5f5;
          padding: 0.15em 0.4em;
          border-radius: 3px;
          font-size: 0.875em;
          font-family: ui-monospace, monospace;
        }
        .prose-share pre {
          background: #f5f5f5;
          padding: 1em;
          border-radius: 6px;
          overflow-x: auto;
          margin: 0.75em 0;
        }
        .prose-share pre code {
          background: none;
          padding: 0;
        }
        .prose-share blockquote {
          border-left: 3px solid #e5e5e5;
          padding-left: 1em;
          color: #6b7280;
          margin: 0.75em 0;
        }
        .prose-share table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.75em 0;
          font-size: 0.9em;
        }
        .prose-share th, .prose-share td {
          border: 1px solid #e5e5e5;
          padding: 0.5em 0.75em;
          text-align: left;
        }
        .prose-share th {
          background: #f9fafb;
          font-weight: 600;
        }
        .prose-share hr {
          border: none;
          border-top: 1px solid #f0f0f0;
          margin: 1.5em 0;
        }
        .prose-share a {
          color: #c26a3a;
          text-decoration: none;
        }
        .prose-share a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

// ── Simple client-side markdown renderer ──

function MarkdownRenderer({ content }: { content: string }) {
  const html = simpleMarkdownToHTML(content);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function simpleMarkdownToHTML(md: string): string {
  const lines = md.split('\n');
  const output: string[] = [];
  let inList = false;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        output.push(`<pre><code>${esc(codeBlockContent.join('\n'))}</code></pre>`);
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        if (inList) {
          output.push('</ul>');
          inList = false;
        }
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (inList) {
        output.push('</ul>');
        inList = false;
      }
      const level = headingMatch[1]!.length;
      output.push(`<h${level}>${inline(headingMatch[2]!)}</h${level}>`);
      continue;
    }

    if (line.match(/^---+$/)) {
      if (inList) {
        output.push('</ul>');
        inList = false;
      }
      output.push('<hr />');
      continue;
    }

    if (line.startsWith('|')) {
      if (inList) {
        output.push('</ul>');
        inList = false;
      }
      if (line.match(/^\|\s*[-:]+/)) continue;
      const cells = line
        .split('|')
        .filter((c) => c.trim() !== '')
        .map((c) => c.trim());
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      const isHeader = nextLine?.match(/^\|\s*[-:]+/);
      if (isHeader) {
        output.push('<table>');
        output.push('<tr>' + cells.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr>');
      } else {
        output.push('<tr>' + cells.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>');
        const after = i + 1 < lines.length ? lines[i + 1] : '';
        if (!after?.startsWith('|')) output.push('</table>');
      }
      continue;
    }

    if (line.startsWith('> ')) {
      if (inList) {
        output.push('</ul>');
        inList = false;
      }
      output.push(`<blockquote><p>${inline(line.slice(2))}</p></blockquote>`);
      continue;
    }

    if (line.match(/^\s*- /)) {
      if (!inList) {
        output.push('<ul>');
        inList = true;
      }
      output.push(`<li>${inline(line.replace(/^\s*- /, ''))}</li>`);
      continue;
    }

    const olMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inList) {
        output.push('<ul>');
        inList = true;
      }
      output.push(`<li>${inline(olMatch[1]!)}</li>`);
      continue;
    }

    if (inList && line.trim() === '') {
      output.push('</ul>');
      inList = false;
      continue;
    }
    if (line.trim() === '') continue;

    if (inList) {
      output.push('</ul>');
      inList = false;
    }
    output.push(`<p>${inline(line)}</p>`);
  }

  if (inList) output.push('</ul>');
  if (inCodeBlock) output.push(`<pre><code>${esc(codeBlockContent.join('\n'))}</code></pre>`);

  return output.join('\n');
}

function inline(text: string): string {
  let out = esc(text);
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/~~(.+?)~~/g, '<del>$1</del>');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
