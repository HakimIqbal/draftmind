'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';

export async function addComment(prdId: string, body: string, parentId: string | null) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('comments')
    .insert({
      prd_id: prdId,
      author_id: user.id,
      parent_id: parentId,
      body,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function resolveComment(commentId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from('comments')
    .update({ resolved_at: new Date().toISOString() })
    .eq('id', commentId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function fetchComments(prdId: string, filter: 'open' | 'resolved' | 'me') {
  const user = await requireUser();
  const supabase = await createClient();

  let query = supabase
    .from('comments')
    .select('*, author:profiles!comments_author_id_fkey(full_name, avatar_color_seed)')
    .eq('prd_id', prdId)
    .order('created_at', { ascending: true });

  if (filter === 'open') query = query.is('resolved_at', null);
  if (filter === 'resolved') query = query.not('resolved_at', 'is', null);

  const { data } = await query;
  let result = data ?? [];

  if (filter === 'me') {
    result = result.filter((c: { author_id: string }) => c.author_id === user.id);
  }

  return result;
}
