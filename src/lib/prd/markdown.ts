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
 * Convert Tiptap JSON content to a plain-text / Markdown string.
 * Preserves basic formatting: paragraphs as newlines, lists as `- item`,
 * headings as `### heading`, bold as `**text**`, italic as `*text*`,
 * and links as `[text](url)`.
 */
export function tiptapToPlainText(content: TiptapContent | null | undefined): string {
  if (!content?.content) return '';
  return content.content.map((node) => renderNode(node as unknown as TiptapNodeLike)).join('\n');
}

function renderNode(node: TiptapNodeLike, indent = ''): string {
  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map((n) => renderNode(n, indent)).join('\n');

    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1;
      const prefix = '#'.repeat(level);
      return `${prefix} ${renderInline(node)}`;
    }

    case 'paragraph':
      return `${indent}${renderInline(node)}`;

    case 'bulletList':
      return (node.content ?? []).map((li) => renderListItem(li, indent, '-')).join('\n');

    case 'orderedList':
      return (node.content ?? [])
        .map((li, i) => renderListItem(li, indent, `${i + 1}.`))
        .join('\n');

    case 'listItem': {
      // Rendered by bulletList/orderedList; standalone fallback
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
      // Unknown node type: try to render children
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
      // First child gets the marker
      lines.push(`${indent}${marker} ${renderNode(child).trim()}`);
    } else {
      // Subsequent children (nested lists, etc.) get indentation
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
    // Non-text inline nodes (e.g. hardBreak)
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

  const tableData: string[][] = [];

  for (const row of rows) {
    const cells = (row.content ?? []).map((cell) => {
      const inner = (cell.content ?? [])
        .map((n) => renderNode(n))
        .join(' ')
        .trim();
      return inner;
    });
    tableData.push(cells);
  }

  if (tableData.length === 0) return '';

  // Calculate column widths
  const colCount = Math.max(...tableData.map((r) => r.length));
  const colWidths: number[] = Array(colCount).fill(3);

  for (const row of tableData) {
    for (let i = 0; i < row.length; i++) {
      colWidths[i] = Math.max(colWidths[i] ?? 3, row[i]!.length);
    }
  }

  const lines: string[] = [];

  // Header row
  const header = tableData[0]!;
  lines.push('| ' + header.map((cell, i) => cell.padEnd(colWidths[i] ?? 3)).join(' | ') + ' |');

  // Separator
  lines.push('| ' + colWidths.map((w) => '-'.repeat(w)).join(' | ') + ' |');

  // Data rows
  for (let i = 1; i < tableData.length; i++) {
    const row = tableData[i]!;
    lines.push('| ' + row.map((cell, j) => cell.padEnd(colWidths[j] ?? 3)).join(' | ') + ' |');
  }

  return lines.join('\n');
}

// ── PRD → Markdown ──

export function prdToMarkdown(prd: PRDDocument): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${prd.metadata.title}`);
  lines.push('');

  // Metadata block
  if (prd.metadata.project_tag) {
    lines.push(`**Project:** ${prd.metadata.project_tag}`);
  }
  if (prd.metadata.start_date || prd.metadata.end_date) {
    const range = [prd.metadata.start_date, prd.metadata.end_date].filter(Boolean).join(' — ');
    lines.push(`**Timeline:** ${range}`);
  }
  if (prd.metadata.stakeholders.length > 0) {
    lines.push(`**Stakeholders:** ${prd.metadata.stakeholders.join(', ')}`);
  }
  lines.push('');

  // ── Overview ──
  lines.push('## Overview');
  lines.push('');
  lines.push(tiptapToPlainText(prd.sections.overview.content));
  lines.push('');

  // ── Problem Statement ──
  lines.push('## Problem Statement');
  lines.push('');
  lines.push(tiptapToPlainText(prd.sections.problem_statement.content));
  lines.push('');

  // ── Objectives ──
  lines.push('## Objectives');
  lines.push('');
  if (prd.sections.objectives.length > 0) {
    const goals = prd.sections.objectives.filter((o) => o.type === 'goal');
    const nonGoals = prd.sections.objectives.filter((o) => o.type === 'non-goal');

    if (goals.length > 0) {
      lines.push('### Goals');
      lines.push('');
      for (const obj of goals) {
        lines.push(`- ${obj.description}`);
        for (const kr of obj.key_results) {
          lines.push(`  - KR: ${kr}`);
        }
      }
      lines.push('');
    }

    if (nonGoals.length > 0) {
      lines.push('### Non-Goals');
      lines.push('');
      for (const obj of nonGoals) {
        lines.push(`- ${obj.description}`);
      }
      lines.push('');
    }
  }

  // ── DARCI Matrix ──
  lines.push('## DARCI Matrix');
  lines.push('');
  const { darci } = prd.sections;
  const darciRoles: Array<[string, typeof darci.decider]> = [
    ['Decider', darci.decider],
    ['Accountable', darci.accountable],
    ['Responsible', darci.responsible],
    ['Consulted', darci.consulted],
    ['Informed', darci.informed],
  ];
  for (const [roleName, roleData] of darciRoles) {
    const people = Array.isArray(roleData) ? roleData : (roleData?.people ?? []);
    const guidelines = Array.isArray(roleData) ? '' : (roleData?.guidelines ?? '');
    if (people.length > 0 || guidelines) {
      lines.push(`### ${roleName}`);
      lines.push('');
      if (people.length > 0) lines.push(`**${people.join(', ')}**`);
      if (guidelines) lines.push(guidelines);
      lines.push('');
    }
  }

  // ── Scope ──
  lines.push('## Scope');
  lines.push('');
  lines.push('### In Scope');
  lines.push('');
  for (const item of prd.sections.scope.in_scope) {
    lines.push(`- ${item}`);
  }
  lines.push('');
  lines.push('### Out of Scope');
  lines.push('');
  for (const item of prd.sections.scope.out_of_scope) {
    lines.push(`- ${item}`);
  }
  lines.push('');

  // ── User Stories ──
  lines.push('## User Stories');
  lines.push('');
  for (const story of prd.sections.user_stories) {
    lines.push(
      `**${story.id}** [${story.priority}] As a ${story.role}, I want ${story.want}, so that ${story.benefit}`,
    );
    lines.push('');
    if (story.acceptance_criteria.length > 0) {
      for (const ac of story.acceptance_criteria) {
        lines.push(`- AC: ${ac}`);
      }
      lines.push('');
    }
  }

  // ── Functional Requirements ──
  lines.push('## Functional Requirements');
  lines.push('');
  for (const req of prd.sections.functional_reqs) {
    lines.push(`**${req.id}** [${req.priority}] ${req.title}`);
    lines.push('');
    lines.push(req.description);
    if (req.dependencies.length > 0) {
      lines.push('');
      lines.push(`Dependencies: ${req.dependencies.join(', ')}`);
    }
    lines.push('');
  }

  // ── Non-Functional Requirements ──
  lines.push('## Non-Functional Requirements');
  lines.push('');
  const { nfr } = prd.sections;
  const nfrCategories: Array<[string, string[]]> = [
    ['Performance', nfr.performance],
    ['Security', nfr.security],
    ['Accessibility', nfr.accessibility],
    ['Scalability', nfr.scalability],
    ['Reliability', nfr.reliability],
    ['Compliance', nfr.compliance],
  ];
  for (const [label, items] of nfrCategories) {
    if (items && items.length > 0) {
      lines.push(`### ${label}`);
      lines.push('');
      for (const item of items) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }
  }

  // ── Success Metrics ──
  lines.push('## Success Metrics');
  lines.push('');
  if (prd.sections.success_metrics.length > 0) {
    lines.push('| Metric | Definition | Baseline | Target | Window |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const m of prd.sections.success_metrics) {
      lines.push(
        `| ${m.name} | ${m.definition || '-'} | ${m.baseline} | ${m.target} | ${m.measurement_window} |`,
      );
    }
    lines.push('');
  }

  // ── Timeline ──
  lines.push('## Timeline');
  lines.push('');
  for (const ms of prd.sections.timeline) {
    const statusTag = ms.status ? ` [${ms.status}]` : '';
    const picTag = ms.pic ? ` — PIC: ${ms.pic}` : '';
    lines.push(`**${ms.title}** — ${ms.date}${statusTag}${picTag}`);
    lines.push('');
    if (ms.activity) {
      lines.push(ms.activity);
      lines.push('');
    }
    if (ms.deliverables.length > 0) {
      lines.push('Deliverables:');
      for (const d of ms.deliverables) {
        lines.push(`- ${d}`);
      }
      lines.push('');
    }
  }

  // ── Risks ──
  lines.push('## Risks');
  lines.push('');
  for (const risk of prd.sections.risks) {
    lines.push(`**${risk.id}** [${risk.likelihood}/${risk.impact}] ${risk.description}`);
    lines.push('');
    lines.push(`Mitigation: ${risk.mitigation}`);
    if (risk.owner) lines.push(`Owner: ${risk.owner}`);
    lines.push('');
  }

  // ── References ──
  lines.push('## References');
  lines.push('');
  for (const ref of prd.sections.references) {
    let line = `- [${ref.title}](${ref.url}) (${ref.type})`;
    if (ref.description) line += ` — ${ref.description}`;
    lines.push(line);
  }
  lines.push('');

  // ── Glossary ──
  lines.push('## Glossary');
  lines.push('');
  for (const entry of prd.sections.glossary) {
    lines.push(`- **${entry.term}:** ${entry.definition}`);
  }
  lines.push('');

  // ── Changelog ──
  lines.push('## Changelog');
  lines.push('');
  for (const entry of prd.sections.changelog) {
    lines.push(`- **v${entry.version}** (${entry.date}) by ${entry.author}: ${entry.summary}`);
  }
  lines.push('');

  return lines.join('\n');
}
