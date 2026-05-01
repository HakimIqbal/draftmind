import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';
import { prdToMarkdown } from '@/lib/prd/markdown';
import { prdToHTML } from '@/lib/export/html';
import { exportPRDToDOCX } from '@/lib/export/docx';
import { exportPRDToPDF } from '@/lib/export/pdf';
import type { PRDDocument } from '@/lib/prd/schema';

export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const body = await req.json();
    const {
      prdId,
      format,
      sections: _sections,
    } = body as {
      prdId: string;
      format: string;
      sections?: string[];
    };

    if (!prdId || !format) {
      return NextResponse.json({ error: 'prdId and format are required' }, { status: 400 });
    }

    // Fetch the PRD
    const supabase = await createClient();
    const { data: prd, error } = await supabase
      .from('prds')
      .select('content')
      .eq('id', prdId)
      .single();

    if (error || !prd) {
      return NextResponse.json({ error: 'PRD not found' }, { status: 404 });
    }

    const doc = prd.content as PRDDocument;

    switch (format) {
      case 'markdown': {
        const md = prdToMarkdown(doc);
        return new NextResponse(md, {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': `attachment; filename="${slugify(doc.metadata.title)}.md"`,
          },
        });
      }

      case 'html': {
        const html = prdToHTML(doc);
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="${slugify(doc.metadata.title)}.html"`,
          },
        });
      }

      case 'pdf': {
        const pdfBuffer = await exportPRDToPDF(doc);
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${slugify(doc.metadata.title)}.pdf"`,
          },
        });
      }

      case 'docx': {
        const docxBuffer = await exportPRDToDOCX(doc);
        return new NextResponse(docxBuffer, {
          headers: {
            'Content-Type':
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${slugify(doc.metadata.title)}.docx"`,
          },
        });
      }

      case 'slack': {
        const md = prdToMarkdown(doc);
        const slackFormatted = toSlackMarkup(doc.metadata.title, md);
        return new NextResponse(slackFormatted, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      case 'jira': {
        const md = prdToMarkdown(doc);
        const jiraFormatted = toJiraMarkup(doc.metadata.title, md);
        return new NextResponse(jiraFormatted, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      default:
        return NextResponse.json({ error: `Unsupported format: ${format}` }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Helpers ──

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

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
