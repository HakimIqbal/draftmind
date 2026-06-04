import 'server-only';

/**
 * Convert Tiptap JSON document to styled HTML.
 * Produces the same visual format as the editor/history view.
 */
export function tiptapToStyledHTML(doc: { type: string; content: TNode[] }, title: string): string {
  const bodyHtml = doc.content.map((n) => renderNode(n)).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 816px;
      margin: 0 auto;
      padding: 48px 64px;
      color: #1a1a1a;
      font-size: 14px;
      line-height: 1.75;
      background: white;
    }
    h1 { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 0; margin-bottom: 1rem; color: #666; }
    h2 { font-size: 1.25rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.625rem; color: #1a1a1a; }
    h3 { font-size: 1rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.375rem; color: #1a1a1a; }
    p { font-size: 14px; margin-bottom: 0.5rem; line-height: 1.7; color: #333; }
    ul, ol { margin: 0.5rem 0 0.625rem; padding-left: 1.5rem; font-size: 14px; color: #333; }
    li { margin-bottom: 0.25rem; }
    li > p { margin: 0; }
    strong { font-weight: 600; color: #111; }
    em { font-style: italic; }
    code { background: #f5f5f5; padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.875em; }
    blockquote { border-left: 3px solid #e5e5e5; padding-left: 1em; color: #6b7280; margin: 0.75rem 0; }
    table { width: 100%; border-collapse: collapse; margin: 0.875rem 0; font-size: 13px; table-layout: auto; word-wrap: break-word; border: 1px solid #e0e0e0; }
    th, td { border: 1px solid #e0e0e0; padding: 8px 12px; text-align: left; vertical-align: top; line-height: 1.55; }
    th { background: #f5f5f4; font-weight: 600; color: #1a1a1a; font-size: 13px; }
    th p, td p { margin: 0; }
    hr { border: none; border-top: 1px solid #ebebeb; margin: 1.75rem 0; }
    a { color: #c26a3a; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .footer { margin-top: 3em; padding-top: 1em; border-top: 1px solid #e5e5e5; color: #999; font-size: 0.85em; text-align: center; }
    @media print {
      body { padding: 20px 15mm; }
      h2 { page-break-after: avoid; }
      table { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
${bodyHtml}
<div class="footer">Generated with DraftMind</div>
</body>
</html>`;
}

interface TNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

function renderNode(node: TNode): string {
  switch (node.type) {
    case 'heading': {
      const level = (node.attrs?.level as number) ?? 2;
      const tag = `h${Math.min(level, 3)}`;
      return `<${tag}>${renderInline(node.content ?? [])}</${tag}>`;
    }
    case 'paragraph':
      return `<p>${renderInline(node.content ?? [])}</p>`;
    case 'bulletList':
      return `<ul>${(node.content ?? []).map((li) => `<li>${(li.content ?? []).map(renderNode).join('')}</li>`).join('')}</ul>`;
    case 'orderedList':
      return `<ol>${(node.content ?? []).map((li) => `<li>${(li.content ?? []).map(renderNode).join('')}</li>`).join('')}</ol>`;
    case 'table':
      return `<table><tbody>${(node.content ?? [])
        .map((row) => {
          const cells = (row.content ?? [])
            .map((cell) => {
              const tag = cell.type === 'tableHeader' ? 'th' : 'td';
              const inner = (cell.content ?? []).map(renderNode).join('');
              return `<${tag}>${inner}</${tag}>`;
            })
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('')}</tbody></table>`;
    case 'blockquote':
      return `<blockquote>${(node.content ?? []).map(renderNode).join('')}</blockquote>`;
    case 'horizontalRule':
      return '<hr />';
    case 'hardBreak':
      return '<br />';
    default:
      if (node.content) return node.content.map(renderNode).join('');
      return '';
  }
}

function renderInline(nodes: TNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'text') {
        let text = esc(node.text ?? '');
        if (node.marks) {
          for (const mark of node.marks) {
            if (mark.type === 'bold') text = `<strong>${text}</strong>`;
            if (mark.type === 'italic') text = `<em>${text}</em>`;
            if (mark.type === 'code') text = `<code>${text}</code>`;
            if (mark.type === 'strike') text = `<del>${text}</del>`;
            if (mark.type === 'link') {
              const href = esc(String(mark.attrs?.href ?? '#'));
              text = `<a href="${href}">${text}</a>`;
            }
          }
        }
        return text;
      }
      if (node.type === 'hardBreak') return '<br />';
      return '';
    })
    .join('');
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}