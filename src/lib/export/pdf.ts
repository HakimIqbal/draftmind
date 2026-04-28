import 'server-only';
import type { PRDDocument } from '@/lib/prd/schema';
import { prdToHTML } from './html';

export interface PDFOptions {
  theme?: 'editorial' | 'plain';
  includeComments?: boolean;
  watermark?: string;
}

export async function exportPRDToPDF(prd: PRDDocument, _options: PDFOptions = {}): Promise<Buffer> {
  const html = prdToHTML(prd);

  try {
    // Dynamic import to avoid bundling in client
    const puppeteer = await import('puppeteer-core');

    let executablePath: string;
    let args: string[] = [];

    if (process.env.DEPLOYMENT_TARGET === 'vps') {
      executablePath = '/usr/bin/chromium-browser';
      args = ['--no-sandbox', '--disable-setuid-sandbox'];
    } else {
      // Vercel / local — use @sparticuz/chromium
      const chromium = await import('@sparticuz/chromium');
      executablePath = await chromium.default.executablePath();
      args = chromium.default.args;
    }

    const browser = await puppeteer.default.launch({
      args,
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-family: monospace; font-size: 9px; color: #7A7468; text-align: right; width: 100%; padding: 0 15mm;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
    });

    await browser.close();
    return Buffer.from(pdf);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error(
      'PDF export failed. Ensure Chromium is available (install @sparticuz/chromium or system chromium).',
    );
  }
}
