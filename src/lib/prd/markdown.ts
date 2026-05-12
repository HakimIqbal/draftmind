import type { PRDDocument, TiptapContent } from './schema';

// ── Tiptap → Plain Text ──

interface TiptapNodeLike {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNodeLike[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

/**
 * Convert Tiptap JSON content to well-formatted Markdown.
 * Preserves: headings, bold, italic, links, lists, tables, blockquotes, code.
 */
export function tiptapToPlainText(content: TiptapContent | null | undefined): string {
  if (!content?.content) return '';
  const blocks = content.content.map((node) => renderNode(node as unknown as TiptapNodeLike));
  // Clean up: remove triple+ blank lines, trim
  return blocks
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function renderNode(node: TiptapNodeLike, indent = ''): string {
  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map((n) => renderNode(n, indent)).join('\n\n');

    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1;
      const prefix = '#'.repeat(level);
      return `${prefix} ${renderInline(node)}`;
    }

    case 'paragraph': {
      const text = renderInline(node);
      return `${indent}${text}`;
    }

    case 'bulletList':
      return (node.content ?? []).map((li) => renderListItem(li, indent, '-')).join('\n');

    case 'orderedList':
      return (node.content ?? [])
        .map((li, i) => renderListItem(li, indent, `${i + 1}.`))
        .join('\n');

    case 'listItem': {
      const inner = (node.content ?? []).map((n) => renderNode(n, indent)).join('\n');
      return inner;
    }

    case 'blockquote': {
      const inner = (node.content ?? []).map((n) => renderNode(n)).join('\n');
      return inner
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
    }

    case 'codeBlock': {
      const lang = (node.attrs?.language as string) ?? '';
      const code = renderInline(node);
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    case 'horizontalRule':
      return '---';

    case 'table':
      return renderTable(node);

    case 'hardBreak':
      return '\n';

    case 'text':
      return renderTextWithMarks(node);

    default:
      if (node.content) {
        return (node.content ?? []).map((n) => renderNode(n, indent)).join('\n');
      }
      return node.text ?? '';
  }
}

function renderListItem(node: TiptapNodeLike, indent: string, marker: string): string {
  const children = node.content ?? [];
  if (children.length === 0) return `${indent}${marker} `;

  const lines: string[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i]!;
    if (i === 0) {
      lines.push(`${indent}${marker} ${renderNode(child).trim()}`);
    } else {
      const nestedIndent = indent + '  ';
      lines.push(renderNode(child, nestedIndent));
    }
  }
  return lines.join('\n');
}

function renderInline(node: TiptapNodeLike): string {
  if (!node.content) return node.text ?? '';
  return node.content.map((child) => renderTextWithMarks(child)).join('');
}

function renderTextWithMarks(node: TiptapNodeLike): string {
  if (node.type !== 'text' || !node.text) {
    if (node.type === 'hardBreak') return '\n';
    if (node.content) return renderInline(node);
    return '';
  }

  let text = node.text;
  const marks = node.marks ?? [];

  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        text = `**${text}**`;
        break;
      case 'italic':
        text = `*${text}*`;
        break;
      case 'code':
        text = `\`${text}\``;
        break;
      case 'strike':
        text = `~~${text}~~`;
        break;
      case 'link':
        text = `[${text}](${(mark.attrs?.href as string) ?? ''})`;
        break;
    }
  }

  return text;
}

function renderTable(node: TiptapNodeLike): string {
  const rows = node.content ?? [];
  if (rows.length === 0) return '';

  const firstRowCells = rows[0]?.content ?? [];
  const hasHeaderRow = firstRowCells.some((cell) => cell.type === 'tableHeader');

  const tableData: string[][] = [];
  for (const row of rows) {
    const cells = (row.content ?? []).map((cell) => {
      const inner = (cell.content ?? [])
        .map((n) => renderNode(n))
        .join(' ')
        .trim()
        .replace(/\n/g, ' '); // flatten newlines within cells
      return inner;
    });
    tableData.push(cells);
  }

  if (tableData.length === 0) return '';

  const colCount = Math.max(...tableData.map((r) => r.length));
  const colWidths: number[] = Array(colCount).fill(3);
  for (const row of tableData) {
    for (let i = 0; i < row.length; i++) {
      colWidths[i] = Math.max(colWidths[i] ?? 3, (row[i] ?? '').length);
    }
  }

  const lines: string[] = [];

  if (hasHeaderRow) {
    // Standard markdown table with header + separator
    const header = tableData[0]!;
    lines.push('| ' + header.map((cell, i) => cell.padEnd(colWidths[i] ?? 3)).join(' | ') + ' |');
    lines.push('| ' + colWidths.map((w) => '-'.repeat(w)).join(' | ') + ' |');
    for (let i = 1; i < tableData.length; i++) {
      const row = tableData[i]!;
      lines.push(
        '| ' + row.map((cell, j) => (cell ?? '').padEnd(colWidths[j] ?? 3)).join(' | ') + ' |',
      );
    }
  } else {
    // No header row — render as bold key : value pairs (metadata table)
    for (const row of tableData) {
      if (row.length >= 2) {
        lines.push(`**${row[0]}**: ${row.slice(1).join(', ')}`);
      } else if (row.length === 1) {
        lines.push(row[0]!);
      }
    }
  }

  return lines.join('\n');
}

// ── PRD → Markdown (legacy fallback) ──

export function prdToMarkdown(prd: PRDDocument): string {
  const lines: string[] = [];

  lines.push(`# ${prd.metadata.title}`);
  lines.push('');

  if (prd.metadata.project_tag) {
    lines.push(`**Project:** ${prd.metadata.project_tag}`);
  }
  if (prd.metadata.owner_name) {
    lines.push(`**Owner:** ${prd.metadata.owner_name}`);
  }
  if (prd.metadata.start_date || prd.metadata.end_date) {
    lines.push(
      `**Timeline:** ${[prd.metadata.start_date, prd.metadata.end_date].filter(Boolean).join(' — ')}`,
    );
  }
  lines.push('');

  const sectionOrder = [
    'overview',
    'problem_statement',
    'objectives',
    'darci',
    'scope',
    'user_stories',
    'functional_reqs',
    'nfr',
    'success_metrics',
    'timeline',
    'risks',
    'references',
    'glossary',
    'changelog',
  ];

  const sectionLabels: Record<string, string> = {
    overview: 'Overview',
    problem_statement: 'Problem Statement',
    objectives: 'Objectives',
    darci: 'DARCI Matrix',
    scope: 'Scope',
    user_stories: 'User Stories',
    functional_reqs: 'Functional Requirements',
    nfr: 'Non-Functional Requirements',
    success_metrics: 'Success Metrics',
    timeline: 'Timeline',
    risks: 'Risks',
    references: 'References',
    glossary: 'Glossary',
    changelog: 'Changelog',
  };

  for (const key of sectionOrder) {
    const val = (prd.sections as Record<string, unknown>)[key];
    if (!val) continue;

    const label = sectionLabels[key] ?? key;
    lines.push(`## ${label}`);
    lines.push('');

    if (typeof val === 'object' && val !== null && 'content' in (val as Record<string, unknown>)) {
      const rich = val as { content?: { content?: { text?: string }[] } };
      if (rich.content?.content) {
        for (const node of rich.content.content) {
          lines.push(node.text ?? '');
        }
      }
    } else if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'string') {
          lines.push(`- ${item}`);
        } else if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>;
          const text = (obj.description ??
            obj.title ??
            obj.term ??
            obj.name ??
            obj.summary ??
            JSON.stringify(obj).slice(0, 100)) as string;
          lines.push(`- ${text}`);
        }
      }
    } else if (typeof val === 'object' && val !== null) {
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        const text =
          typeof v === 'string'
            ? v
            : Array.isArray(v)
              ? (v as string[]).join(', ')
              : JSON.stringify(v).slice(0, 80);
        lines.push(`**${k}**: ${text}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n').trim();
}
