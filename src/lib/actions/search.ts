'use server';

import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createClient } from '@/lib/supabase/server';

export interface SearchResult {
  id: string;
  title: string;
  status: string;
  project_tag: string | null;
  updated_at: string;
  match_source: 'title' | 'content';
  content_snippet: string | null;
}

function extractPlainText(node: Record<string, unknown>): string {
  if (typeof node.text === 'string') return node.text;
  if (!Array.isArray(node.content)) return '';
  return (node.content as Record<string, unknown>[]).map(extractPlainText).join(' ');
}

function extractSnippet(content: Record<string, unknown>, query: string): string | null {
  const text = extractPlainText(content);
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return null;
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + query.length + 60);
  return (
    (start > 0 ? '...' : '') + text.slice(start, end).trim() + (end < text.length ? '...' : '')
  );
}

export async function searchPRDs(query: string): Promise<SearchResult[]> {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return [];

  const supabase = await createClient();

  // Search title first (fast, lightweight)
  const { data: titleMatches } = await supabase
    .from('prds')
    .select('id, title, status, project_tag, updated_at')
    .eq('workspace_id', workspace.id)
    .ilike('title', `%${query}%`)
    .order('updated_at', { ascending: false })
    .limit(20);

  const titleResults: SearchResult[] = (titleMatches ?? []).map((p) => ({
    ...p,
    match_source: 'title' as const,
    content_snippet: null,
  }));

  // If we have < 20 title matches, also search content
  if (titleResults.length < 20) {
    const titleIds = titleResults.map((r) => r.id);
    const remaining = 20 - titleResults.length;

    let contentQuery = supabase
      .from('prds')
      .select('id, title, status, project_tag, updated_at, tiptap_content')
      .eq('workspace_id', workspace.id)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (titleIds.length > 0) {
      contentQuery = contentQuery.not('id', 'in', `(${titleIds.join(',')})`);
    }

    const { data: contentMatches } = await contentQuery;

    const contentResults: SearchResult[] = [];
    for (const p of contentMatches ?? []) {
      if (contentResults.length >= remaining) break;
      const tiptap = p.tiptap_content as Record<string, unknown> | null;
      if (!tiptap) continue;
      const snippet = extractSnippet(tiptap, query);
      if (snippet) {
        contentResults.push({
          id: p.id,
          title: p.title,
          status: p.status,
          project_tag: p.project_tag,
          updated_at: p.updated_at,
          match_source: 'content',
          content_snippet: snippet,
        });
      }
    }

    return [...titleResults, ...contentResults];
  }

  return titleResults;
}
