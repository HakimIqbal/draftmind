import { requireUser } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { VersionHistoryPage } from '@/components/version/version-history-page';

export default async function VersionHistoryRoute({
  params,
}: {
  params: Promise<{ prdId: string }>;
}) {
  await requireUser();
  const { prdId } = await params;
  const supabase = await createClient();

  const { data: prd } = await supabase
    .from('prds')
    .select('id, title, current_version')
    .eq('id', prdId)
    .single();
  if (!prd) redirect('/prds');

  const { data: versions } = await supabase
    .from('prd_versions')
    .select('*, author:profiles!prd_versions_created_by_fkey(full_name, avatar_color_seed)')
    .eq('prd_id', prdId)
    .order('version_number', { ascending: false });

  return <VersionHistoryPage prd={prd} versions={versions ?? []} />;
}
