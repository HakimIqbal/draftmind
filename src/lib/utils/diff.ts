import DiffMatchPatch from 'diff-match-patch';

const dmp = new DiffMatchPatch();

export interface DiffSegment {
  type: 'equal' | 'insert' | 'delete';
  text: string;
}

/**
 * Per-character diff between two strings.
 * Returns segments with type: equal (unchanged), insert (added), delete (removed).
 */
export function diffText(oldText: string, newText: string): DiffSegment[] {
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  return diffs.map(([op, text]) => ({
    type: op === 0 ? 'equal' : op === 1 ? 'insert' : 'delete',
    text,
  }));
}

/**
 * Extract plain text from tiptap JSON or PRDDocument content for diffing.
 */
export function tiptapToPlainText(content: Record<string, unknown>): string {
  // Tiptap format
  const doc = content as { type?: string; content?: Record<string, unknown>[] };
  if (doc.type === 'doc' && Array.isArray(doc.content)) {
    const lines: string[] = [];
    for (const node of doc.content) {
      lines.push(nodeToText(node));
    }
    return lines.join('\n');
  }

  // PRDDocument format
  const sections = (content as { sections?: Record<string, unknown> }).sections;
  if (sections) {
    const lines: string[] = [];
    const metadata = (content as { metadata?: { title?: string } }).metadata;
    if (metadata?.title) lines.push(`# ${metadata.title}`);

    const SECTION_ORDER = [
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

    for (const key of SECTION_ORDER) {
      if (!(key in sections)) continue;
      const val = sections[key as keyof typeof sections] as unknown;
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      lines.push(`\n## ${label}`);

      if (
        typeof val === 'object' &&
        val !== null &&
        'content' in (val as Record<string, unknown>)
      ) {
        const rich = val as { content?: { content?: Record<string, unknown>[] } };
        if (rich.content?.content) {
          for (const node of rich.content.content) lines.push(nodeToText(node));
        }
      } else if (Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === 'string') lines.push(`• ${item}`);
          else if (typeof item === 'object' && item !== null) {
            const obj = item as Record<string, unknown>;
            const text = (obj.description ??
              obj.title ??
              obj.term ??
              obj.name ??
              obj.summary ??
              JSON.stringify(obj).slice(0, 100)) as string;
            lines.push(`• ${text}`);
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
          lines.push(`${k}: ${text}`);
        }
      }
    }
    return lines.join('\n');
  }

  return '';
}

function nodeToText(node: Record<string, unknown>): string {
  const type = node.type as string;
  const children = node.content as Record<string, unknown>[] | undefined;

  if (type === 'text') return (node.text as string) ?? '';

  if (!children) return '';

  if (type === 'heading') {
    const level = (node.attrs as { level?: number } | undefined)?.level ?? 2;
    const text = children.map((c) => nodeToText(c)).join('');
    return '#'.repeat(level) + ' ' + text;
  }

  if (type === 'paragraph') {
    return children.map((c) => nodeToText(c)).join('');
  }

  if (type === 'bulletList' || type === 'orderedList') {
    return children
      .map((li, i) => {
        const liChildren = (li.content as Record<string, unknown>[]) ?? [];
        const text = liChildren.map((c) => nodeToText(c)).join('');
        return type === 'bulletList' ? `• ${text}` : `${i + 1}. ${text}`;
      })
      .join('\n');
  }

  if (type === 'listItem') {
    return children.map((c) => nodeToText(c)).join('');
  }

  if (type === 'table') {
    return children
      .map((row) => {
        const cells = (row.content as Record<string, unknown>[]) ?? [];
        return cells
          .map((cell) => {
            const cellContent = (cell.content as Record<string, unknown>[]) ?? [];
            return cellContent.map((c) => nodeToText(c)).join('');
          })
          .join(' | ');
      })
      .join('\n');
  }

  if (type === 'tableRow' || type === 'tableCell' || type === 'tableHeader') {
    return children.map((c) => nodeToText(c)).join('');
  }

  return children.map((c) => nodeToText(c)).join('');
}
