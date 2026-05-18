-- ============================================================
-- DraftMind RLS Policies
-- Migration 0002: Row Level Security for all tables
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.prd_templates enable row level security;
alter table public.prds enable row level security;
alter table public.prd_sections enable row level security;
alter table public.prd_versions enable row level security;
alter table public.comments enable row level security;
alter table public.prd_shares enable row level security;
alter table public.providers enable row level security;
alter table public.ai_runs enable row level security;
alter table public.ai_review_findings enable row level security;
alter table public.activity_log enable row level security;
alter table public.notifications enable row level security;

-- ========================
-- profiles
-- ========================

create policy "Users can view profiles of workspace co-members"
  on public.profiles for select
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.workspace_members wm1
      join public.workspace_members wm2 on wm1.workspace_id = wm2.workspace_id
      where wm1.user_id = (select auth.uid()) and wm2.user_id = profiles.id
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (id = (select auth.uid()));

-- ========================
-- workspaces
-- ========================

create policy "Members can view their workspaces"
  on public.workspaces for select
  using (public.has_workspace_role(id, array['admin', 'editor', 'commenter', 'viewer']::workspace_role[]));

create policy "Authenticated users can create workspaces"
  on public.workspaces for insert
  with check ((select auth.uid()) is not null);

create policy "Admins can update workspace"
  on public.workspaces for update
  using (public.has_workspace_role(id, array['admin']::workspace_role[]));

create policy "Admins can delete workspace"
  on public.workspaces for delete
  using (public.has_workspace_role(id, array['admin']::workspace_role[]));

-- ========================
-- workspace_members
-- ========================

create policy "Members can view workspace members"
  on public.workspace_members for select
  using (public.has_workspace_role(workspace_id, array['admin', 'editor', 'commenter', 'viewer']::workspace_role[]));

create policy "Admins can manage workspace members"
  on public.workspace_members for insert
  with check (public.has_workspace_role(workspace_id, array['admin']::workspace_role[]));

create policy "Admins can update workspace members"
  on public.workspace_members for update
  using (public.has_workspace_role(workspace_id, array['admin']::workspace_role[]));

create policy "Admins can remove workspace members"
  on public.workspace_members for delete
  using (public.has_workspace_role(workspace_id, array['admin']::workspace_role[]));

-- ========================
-- workspace_invitations
-- ========================

create policy "Members can view invitations"
  on public.workspace_invitations for select
  using (
    public.has_workspace_role(workspace_id, array['admin', 'editor', 'commenter', 'viewer']::workspace_role[])
    or email = (select auth.jwt() ->> 'email')
  );

create policy "Admins can create invitations"
  on public.workspace_invitations for insert
  with check (public.has_workspace_role(workspace_id, array['admin']::workspace_role[]));

create policy "Admins can update invitations"
  on public.workspace_invitations for update
  using (public.has_workspace_role(workspace_id, array['admin']::workspace_role[]));

-- ========================
-- prd_templates
-- ========================

create policy "Members can view templates"
  on public.prd_templates for select
  using (
    is_built_in = true
    or (workspace_id is not null and public.has_workspace_role(workspace_id, array['admin', 'editor', 'commenter', 'viewer']::workspace_role[]))
  );

create policy "Admins and editors can manage templates"
  on public.prd_templates for insert
  with check (workspace_id is not null and public.has_workspace_role(workspace_id, array['admin', 'editor']::workspace_role[]));

create policy "Admins and editors can update templates"
  on public.prd_templates for update
  using (workspace_id is not null and public.has_workspace_role(workspace_id, array['admin', 'editor']::workspace_role[]));

create policy "Admins can delete templates"
  on public.prd_templates for delete
  using (workspace_id is not null and public.has_workspace_role(workspace_id, array['admin']::workspace_role[]));

-- ========================
-- prds
-- ========================

create policy "Members can view PRDs"
  on public.prds for select
  using (public.has_workspace_role(workspace_id, array['admin', 'editor', 'commenter', 'viewer']::workspace_role[]));

create policy "Admins and editors can create PRDs"
  on public.prds for insert
  with check (public.has_workspace_role(workspace_id, array['admin', 'editor']::workspace_role[]));

create policy "Admins and editors can update PRDs"
  on public.prds for update
  using (public.has_workspace_role(workspace_id, array['admin', 'editor']::workspace_role[]));

create policy "Admins can delete PRDs"
  on public.prds for delete
  using (public.has_workspace_role(workspace_id, array['admin']::workspace_role[]));

-- ========================
-- prd_sections
-- ========================

create policy "Members can view PRD sections"
  on public.prd_sections for select
  using (exists (
    select 1 from public.prds p
    where p.id = prd_sections.prd_id
    and public.has_workspace_role(p.workspace_id, array['admin', 'editor', 'commenter', 'viewer']::workspace_role[])
  ));

create policy "Admins and editors can manage PRD sections"
  on public.prd_sections for all
  using (exists (
    select 1 from public.prds p
    where p.id = prd_sections.prd_id
    and public.has_workspace_role(p.workspace_id, array['admin', 'editor']::workspace_role[])
  ));

-- ========================
-- prd_versions
-- ========================

create policy "Members can view PRD versions"
  on public.prd_versions for select
  using (exists (
    select 1 from public.prds p
    where p.id = prd_versions.prd_id
    and public.has_workspace_role(p.workspace_id, array['admin', 'editor', 'commenter', 'viewer']::workspace_role[])
  ));

create policy "Admins and editors can create PRD versions"
  on public.prd_versions for insert
  with check (exists (
    select 1 from public.prds p
    where p.id = prd_versions.prd_id
    and public.has_workspace_role(p.workspace_id, array['admin', 'editor']::workspace_role[])
  ));

-- ========================
-- comments
-- ========================

create policy "Members can view comments"
  on public.comments for select
  using (exists (
    select 1 from public.prds p
    where p.id = comments.prd_id
    and public.has_workspace_role(p.workspace_id, array['admin', 'editor', 'commenter', 'viewer']::workspace_role[])
  ));

create policy "Editors and commenters can create comments"
  on public.comments for insert
  with check (exists (
    select 1 from public.prds p
    where p.id = comments.prd_id
    and public.has_workspace_role(p.workspace_id, array['admin', 'editor', 'commenter']::workspace_role[])
  ));

create policy "Authors or admins can update comments"
  on public.comments for update
  using (
    author_id = (select auth.uid())
    or exists (
      select 1 from public.prds p
      where p.id = comments.prd_id
      and public.has_workspace_role(p.workspace_id, array['admin']::workspace_role[])
    )
  );

create policy "Authors or admins can delete comments"
  on public.comments for delete
  using (
    author_id = (select auth.uid())
    or exists (
      select 1 from public.prds p
      where p.id = comments.prd_id
      and public.has_workspace_role(p.workspace_id, array['admin']::workspace_role[])
    )
  );

-- ========================
-- prd_shares (public access handled via Edge Function)
-- ========================

create policy "Members can view shares"
  on public.prd_shares for select
  using (exists (
    select 1 from public.prds p
    where p.id = prd_shares.prd_id
    and public.has_workspace_role(p.workspace_id, array['admin', 'editor', 'commenter', 'viewer']::workspace_role[])
  ));

create policy "Admins and editors can create shares"
  on public.prd_shares for insert
  with check (exists (
    select 1 from public.prds p
    where p.id = prd_shares.prd_id
    and public.has_workspace_role(p.workspace_id, array['admin', 'editor']::workspace_role[])
  ));

create policy "Admins and editors can update shares"
  on public.prd_shares for update
  using (exists (
    select 1 from public.prds p
    where p.id = prd_shares.prd_id
    and public.has_workspace_role(p.workspace_id, array['admin', 'editor']::workspace_role[])
  ));

-- ========================
-- providers (admin only, api_key_encrypted NEVER via client)
-- ========================

create policy "Admins can view providers"
  on public.providers for select
  using (public.has_workspace_role(workspace_id, array['admin']::workspace_role[]));

create policy "Admins can create providers"
  on public.providers for insert
  with check (public.has_workspace_role(workspace_id, array['admin']::workspace_role[]));

create policy "Admins can update providers"
  on public.providers for update
  using (public.has_workspace_role(workspace_id, array['admin']::workspace_role[]));

create policy "Admins can delete providers"
  on public.providers for delete
  using (public.has_workspace_role(workspace_id, array['admin']::workspace_role[]));

-- ========================
-- ai_runs (read for members, write via service role)
-- ========================

create policy "Members can view AI runs"
  on public.ai_runs for select
  using (public.has_workspace_role(workspace_id, array['admin', 'editor', 'commenter', 'viewer']::workspace_role[]));

-- ai_review_findings
create policy "Members can view AI review findings"
  on public.ai_review_findings for select
  using (exists (
    select 1 from public.ai_runs r
    where r.id = ai_review_findings.ai_run_id
    and public.has_workspace_role(r.workspace_id, array['admin', 'editor', 'commenter', 'viewer']::workspace_role[])
  ));

-- ========================
-- activity_log (read for members, write via service role)
-- ========================

create policy "Members can view activity log"
  on public.activity_log for select
  using (public.has_workspace_role(workspace_id, array['admin', 'editor', 'commenter', 'viewer']::workspace_role[]));

-- ========================
-- notifications (own only)
-- ========================

create policy "Users can view own notifications"
  on public.notifications for select
  using (recipient_id = (select auth.uid()));

create policy "Users can update own notifications"
  on public.notifications for update
  using (recipient_id = (select auth.uid()));
