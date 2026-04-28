import type { PRDDocument } from '@/lib/prd/schema';
import { prdToMarkdown } from '@/lib/prd/markdown';

/**
 * Convert a PRD document to a standalone HTML page.
 */
export function prdToHTML(prd: PRDDocument): string {
  const md = prdToMarkdown(prd);
  const bodyHtml = simpleMarkdownToHTML(md);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(prd.metadata.title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 720px;
      margin: 0 auto;
      padding: 40px 24px;
      color: #1a1a1a;
      line-height: 1.6;
    }
    h1 { font-size: 1.75rem; margin: 1.5em 0 0.5em; border-bottom: 1px solid #e5e5e5; padding-bottom: 0.3em; }
    h2 { font-size: 1.35rem; margin: 1.5em 0 0.5em; }
    h3 { font-size: 1.1rem; margin: 1.2em 0 0.4em; }
    p { margin: 0.5em 0; }
    ul, ol { margin: 0.5em 0; padding-left: 1.5em; }
    li { margin: 0.2em 0; }
    strong { font-weight: 600; }
    em { font-style: italic; }
    code { background: #f5f5f5; padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.9em; }
    pre { background: #f5f5f5; padding: 1em; border-radius: 6px; overflow-x: auto; margin: 0.5em 0; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 3px solid #d4d4d4; padding-left: 1em; color: #666; margin: 0.5em 0; }
    table { width: 100%; border-collapse: collapse; margin: 0.5em 0; }
    th, td { border: 1px solid #e5e5e5; padding: 0.5em 0.75em; text-align: left; }
    th { background: #f9f9f9; font-weight: 600; }
    hr { border: none; border-top: 1px solid #e5e5e5; margin: 1.5em 0; }
    a { color: #c26a3a; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .footer { margin-top: 3em; padding-top: 1em; border-top: 1px solid #e5e5e5; color: #999; font-size: 0.85em; }
  </style>
</head>
<body>
${bodyHtml}
<div class="footer">Generated with DraftMind</div>
</body>
</html>`;
}

// ── Simple Markdown → HTML converter ──

function simpleMarkdownToHTML(md: string): string {
  const lines = md.split('\n');
  const output: string[] = [];
  let inList = false;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        output.push(`<pre><code>${escapeHtml(codeBlockContent.join('\n'))}</code></pre>`);
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

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (inList) {
        output.push('</ul>');
        inList = false;
      }
      const level = headingMatch[1]!.length;
      output.push(`<h${level}>${inlineFormat(headingMatch[2]!)}</h${level}>`);
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      if (inList) {
        output.push('</ul>');
        inList = false;
      }
      output.push('<hr />');
      continue;
    }

    // Table rows
    if (line.startsWith('|')) {
      if (inList) {
        output.push('</ul>');
        inList = false;
      }
      // Check if separator row
      if (line.match(/^\|\s*[-:]+/)) continue;

      const cells = line
        .split('|')
        .filter((c) => c.trim() !== '')
        .map((c) => c.trim());

      // Detect if header (next line is separator)
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      const isHeader = nextLine?.match(/^\|\s*[-:]+/);

      if (isHeader) {
        output.push('<table>');
        output.push('<tr>' + cells.map((c) => `<th>${inlineFormat(c)}</th>`).join('') + '</tr>');
      } else {
        output.push('<tr>' + cells.map((c) => `<td>${inlineFormat(c)}</td>`).join('') + '</tr>');
        // Check if next line is not a table row → close table
        const after = i + 1 < lines.length ? lines[i + 1] : '';
        if (!after?.startsWith('|')) {
          output.push('</table>');
        }
      }
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      if (inList) {
        output.push('</ul>');
        inList = false;
      }
      output.push(`<blockquote><p>${inlineFormat(line.slice(2))}</p></blockquote>`);
      continue;
    }

    // Unordered list
    if (line.match(/^\s*- /)) {
      if (!inList) {
        output.push('<ul>');
        inList = true;
      }
      output.push(`<li>${inlineFormat(line.replace(/^\s*- /, ''))}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inList) {
        output.push('<ul>');
        inList = true;
      }
      output.push(`<li>${inlineFormat(olMatch[1]!)}</li>`);
      continue;
    }

    // Close list if open
    if (inList && line.trim() === '') {
      output.push('</ul>');
      inList = false;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      continue;
    }

    // Paragraph
    if (inList) {
      output.push('</ul>');
      inList = false;
    }
    output.push(`<p>${inlineFormat(line)}</p>`);
  }

  if (inList) output.push('</ul>');
  if (inCodeBlock) {
    output.push(`<pre><code>${escapeHtml(codeBlockContent.join('\n'))}</code></pre>`);
  }

  return output.join('\n');
}

function inlineFormat(text: string): string {
  let out = escapeHtml(text);
  // Bold
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  // Code
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Strikethrough
  out = out.replace(/~~(.+?)~~/g, '<del>$1</del>');
  // Links
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
