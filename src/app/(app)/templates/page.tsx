import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createClient } from '@/lib/supabase/server';
import { TemplatesLibrary } from '@/components/templates/templates-library';
import { TemplatesPoller } from './templates-poller';

export interface Template {
  id: string;
  workspace_id: string | null;
  name: string;
  description: string | null;
  category: string;
  structure: Record<string, unknown>;
  use_count: number;
  is_built_in: boolean;
  created_at: string;
}

export default async function TemplatesPage() {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);

  if (!workspace) {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // Fetch built-in templates (workspace_id IS NULL) + workspace custom templates
  const { data: templates } = await supabase
    .from('prd_templates')
    .select('*')
    .or(`workspace_id.is.null,workspace_id.eq.${workspace.id}`)
    .order('is_built_in', { ascending: false })
    .order('use_count', { ascending: false });

  return (
    <>
      <TemplatesPoller />
      <TemplatesLibrary templates={(templates as Template[]) ?? []} />
    </>
  );
}
