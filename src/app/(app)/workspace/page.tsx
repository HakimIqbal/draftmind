import { redirect } from 'next/navigation';

export default function WorkspacePage() {
  redirect('/workspace/members');
}

// Type exports used by workspace components
export type WorkspaceMemberItem = {
  user_id: string;
  role: string;
  joined_at: string;
  last_active_at: string | null;
  profile: {
    full_name: string | null;
    email: string;
    avatar_color_seed: string | null;
    avatar_url: string | null;
    role_self_reported: string | null;
  };
};

export type WorkspaceInvitationItem = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};
