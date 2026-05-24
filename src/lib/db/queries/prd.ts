import { createAdminClient } from '@/lib/supabase/admin';

export interface PRDListItem {
  id: string;
  title: string;
  project_tag: string | null;
  status: string;
  health_score: number | null;
  word_count: number;
  updated_at: string;
  created_at: string;
  owner: {
    id: string;
    full_name: string | null;
    avatar_color_seed: string | null;
    avatar_url: string | null;
  } | null;
}

export interface PRDFilters {
  status?: string;
  search?: string;
  sort?: string;
}

export interface PRDListResult {
  items: PRDListItem[];
  total: number;
}

export async function getPRDsByWorkspace(
  workspaceId: string,
  filters: PRDFilters = {},
  limit: number = 50,
  offset: number = 0,
): Promise<PRDListResult> {
  const admin = createAdminClient();

  let query = admin
    .from('prds')
    .select(
      'id, title, project_tag, status, health_score, word_count, updated_at, created_at, owner:profiles!prds_owner_id_fkey(id, full_name, avatar_color_seed, avatar_url)',
      { count: 'exact' },
    )
    .eq('workspace_id', workspaceId);

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.search) {
    query = query.ilike('title', `%${filters.search}%`);
  }

  const sortField = filters.sort ?? 'updated_at';
  const ascending = false;
  query = query.order(sortField, { ascending }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('[getPRDsByWorkspace] failed', { workspaceId, filters, error });
    return { items: [], total: 0 };
  }

  const items = (data ?? []).map((row) => ({
    ...row,
    owner: Array.isArray(row.owner) ? (row.owner[0] ?? null) : row.owner,
  })) as PRDListItem[];

  return { items, total: count ?? 0 };
}

export async function getPRDCountByWorkspace(workspaceId: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from('prds')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[getPRDCountByWorkspace] failed', { workspaceId, error });
    return 0;
  }

  return count ?? 0;
}
