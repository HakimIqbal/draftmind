import { createClient } from '@/lib/supabase/server';

export async function getVersionsByPRD(prdId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('prd_versions')
    .select('*')
    .eq('prd_id', prdId)
    .order('version_number', { ascending: false });
  return data ?? [];
}

export async function createVersion(
  prdId: string,
  content: unknown,
  summary: string,
  source: string,
  createdBy: string,
) {
  const supabase = await createClient();
  const { data: prd } = await supabase
    .from('prds')
    .select('current_version')
    .eq('id', prdId)
    .single();
  const nextVersion = (prd?.current_version ?? 0) + 1;

  await supabase.from('prd_versions').insert({
    prd_id: prdId,
    version_number: nextVersion,
    content,
    change_summary: summary,
    source,
    created_by: createdBy,
  });

  await supabase.from('prds').update({ current_version: nextVersion }).eq('id', prdId);
  return nextVersion;
}
