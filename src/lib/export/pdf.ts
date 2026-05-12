import 'server-only';
import type { PRDDocument } from '@/lib/prd/schema';
import { logError } from '@/lib/logging/system-log';
import { prdToHTML } from './html';

export interface PDFOptions {
  theme?: 'editorial' | 'plain';
  includeComments?: boolean;
  watermark?: string;
}

async function launchBrowserAndGeneratePDF(html: string): Promise<Buffer> {
  try {
    const puppeteer = await import('puppeteer-core');

    let executablePath: string;
    let args: string[] = [];

    if (process.env.DEPLOYMENT_TARGET === 'vps') {
      executablePath = '/usr/bin/chromium-browser';
      args = ['--no-sandbox', '--disable-setuid-sandbox'];
    } else if (process.env.DEPLOYMENT_TARGET === 'local') {
      const { existsSync } = await import('fs');
      const localPaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
      ];
      executablePath = localPaths.find((p) => existsSync(p)) ?? '';
      if (!executablePath) {
        throw new Error(
          'No local Chrome/Chromium found. Install Google Chrome or set DEPLOYMENT_TARGET=vps.',
        );
      }
      args = ['--no-sandbox', '--disable-setuid-sandbox'];
    } else {
      const chromium = await import('@sparticuz/chromium');
      executablePath = await chromium.default.executablePath();
      args = chromium.default.args;
    }

    let browser;
    try {
      browser = await puppeteer.default.launch({
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

      return Buffer.from(pdf);
    } finally {
      if (browser) await browser.close();
    }
  } catch (err) {
    logError('export.pdf', err instanceof Error ? err.message : 'PDF export failed', {});
    throw new Error('PDF export failed. Please try again.');
  }
}

export async function exportPRDToPDF(prd: PRDDocument, _options: PDFOptions = {}): Promise<Buffer> {
  const html = prdToHTML(prd);
  return launchBrowserAndGeneratePDF(html);
}

export async function exportPRDToPDFFromHTML(html: string): Promise<Buffer> {
  return launchBrowserAndGeneratePDF(html);
}
