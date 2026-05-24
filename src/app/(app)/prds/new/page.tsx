import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { GenerateForm } from '@/components/generate/generate-form';
import { getWorkspaceMembers } from './actions';

export default async function GeneratePrdPage({
  searchParams,
}: {
  searchParams: Promise<{ brief?: string; template?: string; focus?: string }>;
}) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect('/dashboard');

  const params = await searchParams;
  const initialBrief = params.brief ?? '';
  const initialTemplateId = params.template ?? null;
  const initialFocus = params.focus === 'template' ? 'template' : null;

  // Fetch active providers + workspace members before hydration so the Developer picker
  // is populated immediately and does not depend on a client-side server action round trip.
  const adminSupa = createAdminClient();
  const [{ data: providersList }, initialMembers] = await Promise.all([
    adminSupa
      .from('providers')
      .select('id, display_name, default_model')
      .eq('status', 'active')
      .order('priority', { ascending: true }),
    getWorkspaceMembers(workspace.id as string),
  ]);

  return (
    <div className="mx-auto max-w-3xl p-lg">
      <GenerateForm
        userId={user.id}
        workspaceId={workspace.id as string}
        userName={(user.user_metadata as Record<string, string>)?.full_name ?? user.email ?? ''}
        initialBrief={initialBrief}
        initialTemplateId={initialTemplateId}
        initialFocus={initialFocus}
        providers={(providersList ?? []).map((p) => ({
          id: p.id,
          display_name: p.display_name,
          default_model: p.default_model,
        }))}
        initialMembers={initialMembers}
      />
    </div>
  );
}
