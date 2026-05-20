import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';
import { prdToMarkdown, tiptapToPlainText } from '@/lib/prd/markdown';
import type { TiptapContent } from '@/lib/prd/schema';
import { prdToHTML } from '@/lib/export/html';
import { tiptapToStyledHTML } from '@/lib/export/tiptap-html';
import { exportPRDToDOCX } from '@/lib/export/docx';
import { exportPRDToPDF, exportPRDToPDFFromHTML } from '@/lib/export/pdf';
import type { PRDDocument } from '@/lib/prd/schema';
import { PRD_SECTION_LABELS } from '@/types/prd';
import type { PRDSectionKey } from '@/types/prd';
import { slugify } from '@/lib/utils/slug';

const LABEL_TO_KEY = Object.fromEntries(
  Object.entries(PRD_SECTION_LABELS).map(([k, v]) => [v.toLowerCase(), k]),
);

/**
 * Filter tiptap doc content: remove H2 headings and all content until the next H2
 * for sections in the hiddenSections list.
 */
function filterTiptapSections(
  doc: { type: string; content: Record<string, unknown>[] },
  hiddenSections: string[],
): { type: string; content: Record<string, unknown>[] } {
  const filtered: Record<string, unknown>[] = [];
  let skipping = false;

  for (const node of doc.content) {
    if (node.type === 'heading') {
      const level = (node.attrs as { level?: number } | undefined)?.level ?? 2;
      if (level === 2) {
        const children = node.content as { text?: string }[] | undefined;
        const text = children?.map((c) => c.text ?? '').join('') ?? '';
        const sectionKey = LABEL_TO_KEY[text.toLowerCase()];
        skipping = !!(sectionKey && hiddenSections.includes(sectionKey));
      }
    }
    if (!skipping) {
      filtered.push(node);
    }
  }

  return { ...doc, content: filtered };
}

function filterPRDDocumentSections(doc: PRDDocument, includedSections: string[]): PRDDocument {
  const allowed = new Set(includedSections);
  const next = structuredClone(doc) as PRDDocument;
  for (const key of Object.keys(next.sections) as PRDSectionKey[]) {
    if (!allowed.has(key)) {
      const value = next.sections[key];
      if (Array.isArray(value)) {
        (next.sections as Record<string, unknown>)[key] = [];
      } else if (key === 'overview' || key === 'problem_statement') {
        (next.sections as Record<string, unknown>)[key] = {
          content: { type: 'doc', content: [] },
          word_count: 0,
          ai_generated: false,
        };
      } else if (key === 'darci') {
        (next.sections as Record<string, unknown>)[key] = {
          decider: { people: [], guidelines: '' },
          accountable: { people: [], guidelines: '' },
          responsible: { people: [], guidelines: '' },
          consulted: { people: [], guidelines: '' },
          informed: { people: [], guidelines: '' },
        };
      } else if (key === 'scope') {
        (next.sections as Record<string, unknown>)[key] = { in_scope: [], out_of_scope: [] };
      } else if (key === 'nfr') {
        (next.sections as Record<string, unknown>)[key] = {
          performance: [],
          security: [],
          accessibility: [],
          scalability: [],
          reliability: [],
          compliance: [],
        };
      }
    }
  }
  return next;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    // Lazy import to avoid circular deps
    const { getCurrentWorkspace } = await import('@/lib/db/queries/workspace');
    const workspace = await getCurrentWorkspace(user.id);
    if (!workspace) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { prdId, format, sections } = body as {
      prdId: string;
      format: string;
      sections?: string[];
    };

    if (!prdId || !format) {
      return NextResponse.json({ error: 'prdId and format are required' }, { status: 400 });
    }

    // Fetch the PRD — verify workspace ownership
    const supabase = await createClient();
    const { data: prd, error } = await supabase
      .from('prds')
      .select('content, tiptap_content, title, hidden_sections')
      .eq('id', prdId)
      .eq('workspace_id', workspace.id)
      .single();

    if (error || !prd) {
      return NextResponse.json({ error: 'PRD not found' }, { status: 404 });
    }

    const allSectionKeys = Object.keys(PRD_SECTION_LABELS);
    const requestedSections =
      Array.isArray(sections) && sections.length > 0 ? sections : allSectionKeys;
    const selectedSections = requestedSections.filter((section) =>
      allSectionKeys.includes(section),
    );
    if (selectedSections.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid section is required' },
        { status: 400 },
      );
    }

    const doc = filterPRDDocumentSections(prd.content as PRDDocument, selectedSections);
    const hiddenSections: string[] = [
      ...new Set([
        ...(((prd as Record<string, unknown>).hidden_sections as string[]) ?? []),
        ...allSectionKeys.filter((key) => !selectedSections.includes(key)),
      ]),
    ];
    // Filter tiptap content: remove nodes belonging to hidden sections
    const rawTiptap = prd.tiptap_content as {
      type: string;
      content: Record<string, unknown>[];
    } | null;
    const tiptapDoc =
      rawTiptap && hiddenSections.length > 0
        ? filterTiptapSections(rawTiptap, hiddenSections)
        : rawTiptap;

    const { logActivity } = await import('@/lib/logging/activity-log');
    await logActivity({
      workspaceId: workspace.id,
      actorId: user.id,
      type: 'prd_exported',
      resourceType: 'prd',
      resourceId: prdId,
      metadata: { format, sections: selectedSections },
    });

    switch (format) {
      case 'markdown': {
        const md = tiptapDoc
          ? tiptapToPlainText(tiptapDoc as unknown as TiptapContent)
          : prdToMarkdown(doc);
        return new NextResponse(md, {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': `attachment; filename="${slugify(prd.title)}.md"`,
          },
        });
      }

      case 'html': {
        // Use tiptap content for consistent formatting (matches editor/history)
        const html = tiptapDoc
          ? tiptapToStyledHTML(
              tiptapDoc as unknown as Parameters<typeof tiptapToStyledHTML>[0],
              prd.title,
            )
          : prdToHTML(doc);
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="${slugify(prd.title)}.html"`,
          },
        });
      }

      case 'pdf': {
        // Use tiptap-styled HTML for PDF so format matches editor
        const pdfHtml = tiptapDoc
          ? tiptapToStyledHTML(
              tiptapDoc as unknown as Parameters<typeof tiptapToStyledHTML>[0],
              prd.title,
            )
          : null;
        const pdfBuffer = pdfHtml
          ? await exportPRDToPDFFromHTML(pdfHtml)
          : await exportPRDToPDF(doc);
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${slugify(prd.title)}.pdf"`,
          },
        });
      }

      case 'docx': {
        // Use tiptap content for consistent formatting
        const docxBuffer = tiptapDoc
          ? await exportPRDToDOCX(doc, tiptapDoc as unknown as TiptapContent)
          : await exportPRDToDOCX(doc);
        return new NextResponse(docxBuffer, {
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${slugify(prd.title)}.docx"`,
          },
        });
      }

      case 'slack': {
        const md = tiptapDoc
          ? tiptapToPlainText(tiptapDoc as unknown as TiptapContent)
          : prdToMarkdown(doc);
        const slackFormatted = toSlackMarkup(prd.title, md);
        return new NextResponse(slackFormatted, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      case 'jira': {
        const md = tiptapDoc
          ? tiptapToPlainText(tiptapDoc as unknown as TiptapContent)
          : prdToMarkdown(doc);
        const jiraFormatted = toJiraMarkup(prd.title, md);
        return new NextResponse(jiraFormatted, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      default:
        return NextResponse.json({ error: `Unsupported format: ${format}` }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed';
    const { logError } = await import('@/lib/logging/system-log');
    logError('export', message);
    return NextResponse.json({ error: 'Export failed. Please try again.' }, { status: 500 });
  }
}

// ── Helpers ──

function toSlackMarkup(title: string, markdown: string): string {
  // Convert markdown to Slack mrkdwn format
  let text = markdown;
  // Headings → bold
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '*$1*');
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '*$1*');
  // Links are already [text](url) which Slack supports as <url|text>
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>');

  return `*${title}*\n${'—'.repeat(40)}\n\n${text}`;
}

function toJiraMarkup(title: string, markdown: string): string {
  // Convert markdown to Jira wiki markup
  let text = markdown;
  // Headings
  text = text.replace(/^######\s+(.+)$/gm, 'h6. $1');
  text = text.replace(/^#####\s+(.+)$/gm, 'h5. $1');
  text = text.replace(/^####\s+(.+)$/gm, 'h4. $1');
  text = text.replace(/^###\s+(.+)$/gm, 'h3. $1');
  text = text.replace(/^##\s+(.+)$/gm, 'h2. $1');
  text = text.replace(/^#\s+(.+)$/gm, 'h1. $1');
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '*$1*');
  // Italic
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '_$1_');
  // Bullet lists
  text = text.replace(/^- (.+)$/gm, '* $1');
  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1|$2]');

  return `h1. ${title}\n\n${text}`;
}
