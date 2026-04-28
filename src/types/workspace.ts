export type WorkspaceRole = 'admin' | 'editor' | 'commenter' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  icon_pattern: string;
  is_private: boolean;
  industry: string | null;
  team_size: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  last_active_at: string | null;
}
