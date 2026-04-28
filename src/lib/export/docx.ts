import 'server-only';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import type { PRDDocument } from '@/lib/prd/schema';
import { PRD_SECTION_KEYS, PRD_SECTION_LABELS } from '@/types/prd';

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
      return '[Rich text content]';
    }
    return JSON.stringify(section, null, 2);
  }
  return String(section);
}

export async function exportPRDToDOCX(prd: PRDDocument): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      text: prd.metadata.title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    }),
  );

  if (prd.metadata.project_tag) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Project: ', bold: true, font: 'Arial', size: 20 }),
          new TextRun({ text: prd.metadata.project_tag, font: 'Arial', size: 20 }),
        ],
        spacing: { after: 100 },
      }),
    );
  }

  children.push(new Paragraph({ text: '', spacing: { after: 200 } }));

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

    if (lines.length === 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '[No content]',
              italics: true,
              color: '999999',
              font: 'Arial',
              size: 20,
            }),
          ],
        }),
      );
    } else {
      for (const line of lines) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line, font: 'Arial', size: 20 })],
            spacing: { after: 100 },
          }),
        );
      }
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
