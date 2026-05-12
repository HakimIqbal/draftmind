import { requireUser } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { InviteResponse } from './invite-response';

export default async function InvitePage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const user = await requireUser();
  const { invitationId } = await params;
  const admin = createAdminClient();

  // Fetch invitation details
  const { data: invitation } = await admin
    .from('workspace_invitations')
    .select('id, workspace_id, email, role, expires_at, accepted_at, revoked_at, invited_by')
    .eq('id', invitationId)
    .single();

  if (!invitation) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-[20px] font-bold text-[#1a1a1a]">Invitation not found</h1>
        <p className="mt-2 text-[13px] text-[#888]">
          This invitation link is invalid or has been removed.
        </p>
      </div>
    );
  }

  if (invitation.accepted_at) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-[20px] font-bold text-[#1a1a1a]">Already accepted</h1>
        <p className="mt-2 text-[13px] text-[#888]">This invitation has already been accepted.</p>
      </div>
    );
  }

  if (invitation.revoked_at) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-[20px] font-bold text-[#1a1a1a]">Invitation revoked</h1>
        <p className="mt-2 text-[13px] text-[#888]">
          This invitation has been revoked by the workspace admin.
        </p>
      </div>
    );
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-[20px] font-bold text-[#1a1a1a]">Invitation expired</h1>
        <p className="mt-2 text-[13px] text-[#888]">
          This invitation has expired. Ask the workspace admin to send a new one.
        </p>
      </div>
    );
  }

  // Fetch workspace name + inviter name
  const [{ data: workspace }, { data: inviter }] = await Promise.all([
    admin.from('workspaces').select('name').eq('id', invitation.workspace_id).single(),
    admin.from('profiles').select('full_name').eq('id', invitation.invited_by).single(),
  ]);

  // Check if invitation is for this user
  const { data: profile } = await admin.from('profiles').select('email').eq('id', user.id).single();
  const isForMe = profile?.email?.toLowerCase() === invitation.email.toLowerCase();

  if (!isForMe) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-[20px] font-bold text-[#1a1a1a]">Not your invitation</h1>
        <p className="mt-2 text-[13px] text-[#888]">
          This invitation was sent to <strong>{invitation.email}</strong>. You are logged in as{' '}
          <strong>{profile?.email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <div className="rounded-xl border border-[#eee] bg-white p-8 text-center shadow-sm">
        <div className="bg-accent/10 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>

        <h1 className="text-[20px] font-bold text-[#1a1a1a]">Workspace Invitation</h1>
        <p className="mt-3 text-[14px] text-[#555]">
          <strong>{inviter?.full_name ?? 'A team member'}</strong> invited you to join
        </p>
        <p className="mt-1 text-[18px] font-semibold text-[#1a1a1a]">
          {workspace?.name ?? 'a workspace'}
        </p>
        <p className="mt-2 text-[13px] text-[#888]">
          Role:{' '}
          <span className="rounded-md bg-[#f5f5f4] px-2 py-0.5 text-[12px] font-medium capitalize text-[#555]">
            {invitation.role}
          </span>
        </p>

        <InviteResponse
          invitationId={invitation.id}
          workspaceName={workspace?.name ?? 'workspace'}
        />
      </div>
    </div>
  );
}
