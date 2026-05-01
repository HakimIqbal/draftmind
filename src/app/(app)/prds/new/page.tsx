import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { redirect } from 'next/navigation';
import { GenerateForm } from '@/components/generate/generate-form';

export default async function GeneratePrdPage({
  searchParams,
}: {
  searchParams: Promise<{ brief?: string }>;
}) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) redirect('/dashboard');

  const params = await searchParams;
  const initialBrief = params.brief ?? '';

  return (
    <div className="mx-auto max-w-3xl p-lg">
      <GenerateForm
        userId={user.id}
        workspaceId={workspace.id as string}
        userName={(user.user_metadata as Record<string, string>)?.full_name ?? user.email ?? ''}
        initialBrief={initialBrief}
      />
    </div>
  );
}
