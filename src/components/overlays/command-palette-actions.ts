'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';

export async function searchPRDs() {
  await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from('prds')
    .select('id, title, project_tag, status')
    .order('updated_at', { ascending: false })
    .limit(20);

  return data ?? [];
}
