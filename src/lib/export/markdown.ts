import { prdToMarkdown } from '@/lib/prd/markdown';
import type { PRDDocument } from '@/lib/prd/schema';

export function exportPRDToMarkdown(prd: PRDDocument): string {
  return prdToMarkdown(prd);
}
