import 'server-only';
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} from 'docx';
import type { PRDDocument, TiptapContent } from '@/lib/prd/schema';
import { PRD_SECTION_KEYS, PRD_SECTION_LABELS } from '@/types/prd';

// ── Types ──

interface TNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

// ── Constants ──

const FONT = 'Arial';
const BODY_SIZE = 22; // 11pt
const _SMALL_SIZE = 20; // 10pt
const TABLE_SIZE = 20; // 10pt
const H1_SIZE = 32; // 16pt
const H2_SIZE = 26; // 13pt
const H3_SIZE = 22; // 11pt

const CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
};

const HEADER_SHADING = {
  type: ShadingType.SOLID,
  color: 'F5F5F4',
  fill: 'F5F5F4',
};

// ── Tiptap → DOCX ──

function tiptapToDocx(nodes: TNode[]): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];

  for (const node of nodes) {
    switch (node.type) {
      case 'heading': {
        const level = (node.attrs?.level as number) ?? 2;
        const headingLevel =
          level === 1
            ? HeadingLevel.HEADING_1
            : level === 2
              ? HeadingLevel.HEADING_2
              : HeadingLevel.HEADING_3;
        const fontSize = level === 1 ? H1_SIZE : level === 2 ? H2_SIZE : H3_SIZE;

        result.push(
          new Paragraph({
            children: inlineToRuns(node.content ?? [], { bold: true, size: fontSize }),
            heading: headingLevel,
            spacing: { before: level === 1 ? 200 : 360, after: 120 },
            ...(level === 2
              ? {
                  border: {
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E3', space: 4 },
                  },
                }
              : {}),
          }),
        );
        break;
      }

      case 'paragraph': {
        const runs = inlineToRuns(node.content ?? []);
        result.push(
          new Paragraph({
            children:
              runs.length > 0 ? runs : [new TextRun({ text: '', font: FONT, size: BODY_SIZE })],
            spacing: { after: 100, line: 276 }, // 1.15 line spacing
          }),
        );
        break;
      }

      case 'bulletList': {
        const items = node.content ?? [];
        items.forEach((li) => {
          const _text = nodeToInlineText(li);
          result.push(
            new Paragraph({
              children: [
                new TextRun({ text: '•  ', font: FONT, size: BODY_SIZE, color: '999999' }),
                ...inlineFromLi(li),
              ],
              spacing: { after: 60, line: 276 },
              indent: { left: 400 },
            }),
          );
        });
        break;
      }

      case 'orderedList': {
        const items = node.content ?? [];
        items.forEach((li, i) => {
          result.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${i + 1}.  `, font: FONT, size: BODY_SIZE, color: '999999' }),
                ...inlineFromLi(li),
              ],
              spacing: { after: 60, line: 276 },
              indent: { left: 400 },
            }),
          );
        });
        break;
      }

      case 'table': {
        const table = buildTable(node);
        if (table) {
          result.push(table);
          result.push(new Paragraph({ text: '', spacing: { after: 100 } }));
        }
        break;
      }

      case 'blockquote': {
        const runs = inlineFromContent(node.content ?? []);
        result.push(
          new Paragraph({
            children: runs,
            spacing: { after: 100, line: 276 },
            indent: { left: 400 },
            border: { left: { style: BorderStyle.SINGLE, size: 6, color: 'E5E5E5', space: 8 } },
          }),
        );
        break;
      }

      case 'horizontalRule':
        result.push(
          new Paragraph({
            children: [new TextRun({ text: '' })],
            spacing: { before: 200, after: 200 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5', space: 8 } },
          }),
        );
        break;

      default:
        if (node.content) {
          result.push(...tiptapToDocx(node.content));
        }
    }
  }

  return result;
}

// ── Table builder ──

function buildTable(node: TNode): Table | null {
  const rows = node.content ?? [];
  if (rows.length === 0) return null;

  const colCount = Math.max(...rows.map((r) => (r.content ?? []).length));
  if (colCount === 0) return null;

  const colWidth = Math.floor(9200 / colCount);

  const docxRows = rows.map((row) => {
    const cells = (row.content ?? []).map((cell) => {
      const isHeader = cell.type === 'tableHeader';
      const runs = inlineFromContent(cell.content ?? []);

      return new TableCell({
        children: [
          new Paragraph({
            children:
              runs.length > 0 ? runs : [new TextRun({ text: '', font: FONT, size: TABLE_SIZE })],
            spacing: { after: 0 },
          }),
        ],
        width: { size: colWidth, type: WidthType.DXA },
        borders: CELL_BORDER,
        ...(isHeader ? { shading: HEADER_SHADING } : {}),
        margins: { top: 60, bottom: 60, left: 80, right: 80 },
      });
    });

    // Pad short rows
    while (cells.length < colCount) {
      cells.push(
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: '', font: FONT, size: TABLE_SIZE })] }),
          ],
          width: { size: colWidth, type: WidthType.DXA },
          borders: CELL_BORDER,
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
        }),
      );
    }

    return new TableRow({ children: cells });
  });

  return new Table({
    rows: docxRows,
    width: { size: 9200, type: WidthType.DXA },
  });
}

// ── Inline helpers ──

function inlineToRuns(nodes: TNode[], overrides?: { bold?: boolean; size?: number }): TextRun[] {
  const runs: TextRun[] = [];
  for (const node of nodes) {
    if (node.type === 'text' && node.text) {
      const marks = node.marks ?? [];
      const bold = overrides?.bold || marks.some((m) => m.type === 'bold');
      const italic = marks.some((m) => m.type === 'italic');
      const strike = marks.some((m) => m.type === 'strike');
      runs.push(
        new TextRun({
          text: node.text,
          bold,
          italics: italic,
          strike,
          font: FONT,
          size: overrides?.size ?? BODY_SIZE,
        }),
      );
    } else if (node.type === 'hardBreak') {
      runs.push(new TextRun({ text: '', break: 1, font: FONT, size: BODY_SIZE }));
    }
  }
  if (runs.length === 0) {
    runs.push(new TextRun({ text: '', font: FONT, size: overrides?.size ?? BODY_SIZE }));
  }
  return runs;
}

function inlineFromLi(li: TNode): TextRun[] {
  const paragraphs = li.content ?? [];
  const runs: TextRun[] = [];
  for (const p of paragraphs) {
    if (p.content) {
      runs.push(...inlineToRuns(p.content));
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text: '', font: FONT, size: BODY_SIZE })];
}

function inlineFromContent(nodes: TNode[]): TextRun[] {
  const runs: TextRun[] = [];
  for (const node of nodes) {
    if (node.type === 'paragraph' || node.type === 'tableCell' || node.type === 'tableHeader') {
      if (node.content) {
        runs.push(...inlineToRuns(node.content, { size: TABLE_SIZE }));
      }
    } else if (node.type === 'text') {
      runs.push(...inlineToRuns([node], { size: TABLE_SIZE }));
    } else if (node.content) {
      runs.push(...inlineFromContent(node.content));
    }
  }
  return runs;
}

function nodeToInlineText(node: TNode): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map(nodeToInlineText).join('');
}

// ── Legacy PRDDocument fallback ──

function extractSectionText(section: unknown): string {
  if (!section) return '';
  if (typeof section === 'string') return section;
  if (Array.isArray(section)) {
    return section
      .map((item) => (typeof item === 'string' ? item : JSON.stringify(item, null, 2)))
      .join('\n');
  }
  if (typeof section === 'object' && section !== null) {
    const obj = section as Record<string, unknown>;
    if ('content' in obj && typeof obj.content === 'object') {
      const content = obj.content as { content?: { text?: string }[] };
      return (content.content ?? [])
        .map((n) => n.text ?? '')
        .filter(Boolean)
        .join('\n');
    }
    return JSON.stringify(section, null, 2);
  }
  return String(section);
}

// ── Export function ──

export async function exportPRDToDOCX(
  prd: PRDDocument,
  tiptapContent?: TiptapContent | null,
): Promise<Buffer> {
  let children: (Paragraph | Table)[];

  if (tiptapContent?.content) {
    children = tiptapToDocx(tiptapContent.content as unknown as TNode[]);
  } else {
    // Fallback: PRDDocument format
    children = [];
    children.push(
      new Paragraph({
        text: prd.metadata.title,
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
      }),
    );

    for (const key of PRD_SECTION_KEYS) {
      const label = PRD_SECTION_LABELS[key] ?? key;
      const content = prd.sections[key];

      children.push(
        new Paragraph({
          text: label,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
      );

      const text = extractSectionText(content);
      const lines = text.split('\n').filter((l) => l.trim());

      for (const line of lines) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line, font: FONT, size: BODY_SIZE })],
            spacing: { after: 100 },
          }),
        );
      }
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: BODY_SIZE },
        },
        heading1: {
          run: { font: FONT, size: H1_SIZE, bold: true, color: '1A1A1A' },
          paragraph: { spacing: { before: 200, after: 120 } },
        },
        heading2: {
          run: { font: FONT, size: H2_SIZE, bold: true, color: '1A1A1A' },
          paragraph: { spacing: { before: 360, after: 120 } },
        },
        heading3: {
          run: { font: FONT, size: H3_SIZE, bold: true, color: '333333' },
          paragraph: { spacing: { before: 240, after: 80 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1080, bottom: 1440, left: 1080 }, // 1" top/bottom, 0.75" sides
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
