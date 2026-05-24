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

    const { existsSync } = await import('fs');
    const localPaths = [
      process.env.CHROME_EXECUTABLE_PATH,
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ].filter(Boolean) as string[];

    executablePath = localPaths.find((path) => existsSync(path)) ?? '';
    if (executablePath) {
      args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];
    } else {
      const chromium = await import('@sparticuz/chromium');
      executablePath = await chromium.default.executablePath();
      args = chromium.default.args;
    }

    if (!executablePath) {
      throw new Error('No Chrome/Chromium executable found for PDF export.');
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
    const detail =
      err instanceof Error ? { message: err.message, stack: err.stack } : { message: String(err) };
    console.error('[export.pdf] failed', detail);
    logError('export.pdf', detail.message, detail);
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
