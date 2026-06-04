'use client';

import { Globe, Lock } from 'lucide-react';
import type { PRDDocument } from '@/lib/prd/schema';
import { prdToTiptap } from '@/lib/prd/tiptap-content';
import type { TiptapDoc, TiptapNode } from '@/lib/prd/tiptap-content';

interface PublicShareViewProps {
  prd: PRDDocument;
  tiptapContent?: TiptapDoc | null;
}

export function PublicShareView({ prd, tiptapContent }: PublicShareViewProps) {
  // Use tiptap_content if available, otherwise convert from PRDDocument
  const doc: TiptapDoc = (tiptapContent as TiptapDoc) ?? prdToTiptap(prd);

  return (
    <div className="min-h-screen bg-[#f0efed]">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-12 max-w-[860px] items-center justify-between px-4 sm:px-6">
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

      {/* Paper — same style as editor */}
      <main
        className="mx-auto my-4 w-full max-w-[816px] rounded-sm bg-white px-4 py-6 shadow-sm sm:my-6 sm:px-8 sm:py-8 md:my-8 md:px-16 md:py-12"
        style={{ minHeight: '1056px' }}
      >
        <TiptapRenderer nodes={doc.content} />
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-[816px] px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-center text-xs text-gray-400">Generated with DraftMind</p>
      </footer>
    </div>
  );
}

// ── Tiptap JSON → HTML renderer (matches editor/history style) ──

function TiptapRenderer({ nodes }: { nodes: TiptapNode[] }) {
  return (
    <div className="tiptap-share">
      {nodes.map((node, i) => (
        <RenderNode key={i} node={node} />
      ))}
      <style>{shareStyles}</style>
    </div>
  );
}

function RenderNode({ node }: { node: TiptapNode }) {
  switch (node.type) {
    case 'heading': {
      const level = (node.attrs?.level as number) ?? 2;
      const children = renderInline(node.content ?? []);
      if (level === 1) return <h1>{children}</h1>;
      if (level === 3) return <h3>{children}</h3>;
      return <h2>{children}</h2>;
    }
    case 'paragraph':
      return <p>{renderInline(node.content ?? [])}</p>;
    case 'bulletList':
      return (
        <ul>
          {(node.content ?? []).map((li, i) => (
            <li key={i}>
              {(li.content ?? []).map((child, j) => (
                <RenderNode key={j} node={child} />
              ))}
            </li>
          ))}
        </ul>
      );
    case 'orderedList':
      return (
        <ol>
          {(node.content ?? []).map((li, i) => (
            <li key={i}>
              {(li.content ?? []).map((child, j) => (
                <RenderNode key={j} node={child} />
              ))}
            </li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <table>
          <tbody>
            {(node.content ?? []).map((row, ri) => (
              <tr key={ri}>
                {(row.content ?? []).map((cell, ci) => {
                  const isHeader = cell.type === 'tableHeader';
                  const CellTag = isHeader ? 'th' : 'td';
                  return (
                    <CellTag key={ci}>
                      {(cell.content ?? []).map((child, j) => (
                        <RenderNode key={j} node={child} />
                      ))}
                    </CellTag>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'blockquote':
      return (
        <blockquote>
          {(node.content ?? []).map((child, i) => (
            <RenderNode key={i} node={child} />
          ))}
        </blockquote>
      );
    case 'horizontalRule':
      return <hr />;
    default:
      if (node.content) {
        return (
          <>
            {node.content.map((child, i) => (
              <RenderNode key={i} node={child} />
            ))}
          </>
        );
      }
      return null;
  }
}

function renderInline(nodes: TiptapNode[]): React.ReactNode[] {
  return nodes.map((node, i) => {
    if (node.type === 'text') {
      let el: React.ReactNode = node.text ?? '';
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === 'bold') el = <strong key={i}>{el}</strong>;
          if (mark.type === 'italic') el = <em key={i}>{el}</em>;
          if (mark.type === 'code') el = <code key={i}>{el}</code>;
          if (mark.type === 'strike') el = <del key={i}>{el}</del>;
          if (mark.type === 'link') {
            const href = (mark.attrs?.href as string) ?? '#';
            el = (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer">
                {el}
              </a>
            );
          }
        }
      }
      return <span key={i}>{el}</span>;
    }
    if (node.type === 'hardBreak') return <br key={i} />;
    return null;
  });
}

const shareStyles = `
.tiptap-share {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.7;
  color: #333;
}
.tiptap-share h1 {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: 0;
  margin-bottom: 1rem;
  color: #666;
}
.tiptap-share h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 0.625rem;
  color: #1a1a1a;
}
.tiptap-share h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.375rem;
  color: #1a1a1a;
}
.tiptap-share p {
  font-size: 14px;
  margin-bottom: 0.5rem;
  line-height: 1.7;
  color: #333;
}
.tiptap-share ul, .tiptap-share ol {
  margin: 0.5rem 0 0.625rem;
  padding-left: 1.5rem;
  font-size: 14px;
  color: #333;
}
.tiptap-share li {
  margin-bottom: 0.25rem;
}
.tiptap-share li > p {
  margin: 0;
}
.tiptap-share strong {
  font-weight: 600;
  color: #111;
}
.tiptap-share table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.875rem 0;
  font-size: 13px;
  table-layout: auto;
  word-wrap: break-word;
  border: 1px solid #e0e0e0;
}
.tiptap-share th, .tiptap-share td {
  border: 1px solid #e0e0e0;
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
  line-height: 1.55;
}
.tiptap-share th {
  background: #f5f5f4;
  font-weight: 600;
  color: #1a1a1a;
  font-size: 13px;
}
.tiptap-share th p, .tiptap-share td p {
  margin: 0;
}
.tiptap-share hr {
  border: none;
  border-top: 1px solid #ebebeb;
  margin: 1.75rem 0;
}
.tiptap-share a {
  color: #2563eb;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.tiptap-share a:hover {
  color: #1d4ed8;
}
.tiptap-share code {
  background: #f5f5f5;
  padding: 0.15em 0.4em;
  border-radius: 3px;
  font-size: 0.875em;
}
.tiptap-share blockquote {
  border-left: 3px solid #e5e5e5;
  padding-left: 1em;
  color: #6b7280;
  margin: 0.75rem 0;
}
`;
