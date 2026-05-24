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
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();

  // Fetch built-in templates using admin client (RLS blocks user client from seeing global templates)
  // and custom workspace templates using user client
  const [{ data: builtInTemplates }, { data: customTemplates }] = await Promise.all([
    admin
      .from('prd_templates')
      .select('*')
      .eq('is_built_in', true)
      .order('use_count', { ascending: false }),
    supabase
      .from('prd_templates')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('is_built_in', false)
      .order('use_count', { ascending: false }),
  ]);

  const templates = [
    ...((builtInTemplates ?? []) as Template[]),
    ...((customTemplates ?? []) as Template[]),
  ];

  return (
    <>
      <TemplatesPoller />
      <TemplatesLibrary
        canManageTemplates={workspace.currentRole === 'admin'}
        templates={(templates as Template[]) ?? []}
      />
    </>
  );
}
