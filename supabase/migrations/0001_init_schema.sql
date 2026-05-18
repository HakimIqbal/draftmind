-- ============================================================
-- DraftMind Database Schema
-- Migration 0001: All tables, enums, indexes
-- ============================================================

-- ========================
-- ENUMS
-- ========================

create type workspace_role as enum ('admin', 'editor', 'commenter', 'viewer');

create type prd_status as enum (
  'draft', 'in_review', 'reviewed', 'refined', 'final',
  'blocked', 'approved', 'shipped', 'archived'
);

create type provider_type as enum (
  'anthropic', 'openai', 'gemini', 'groq', 'sumopod', 'ganrouter', 'custom'
);

create type provider_status as enum ('active', 'disconnected', 'error');

create type ai_run_type as enum (
  'generate_prd', 'refine_section', 'regenerate_prd',
  'ai_review', 'inline_suggest', 'quick_action'
);

create type ai_run_status as enum ('queued', 'running', 'success', 'error', 'cancelled');

create type finding_severity as enum ('high', 'medium', 'low');

create type activity_type as enum (
  'prd_created', 'prd_edited', 'prd_status_changed', 'prd_archived', 'prd_exported',
  'comment_added', 'comment_resolved',
  'review_requested', 'review_approved', 'review_rejected',
  'ai_generation_completed', 'ai_review_completed', 'ai_refinement_applied',
  'member_invited', 'member_joined', 'member_role_changed', 'member_removed',
  'workspace_created', 'workspace_settings_changed',
  'provider_added', 'provider_disconnected',
  'login', 'logout',
  'public_share_created', 'public_share_viewed'
);

create type notification_type as enum (
  'mention', 'review_request', 'approval_needed', 'comment_reply',
  'ai_suggestion_ready', 'integration_event', 'workspace_invite'
);

-- ========================
-- 4.1 Identity & Workspace
-- ========================

-- profiles: extends auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_initials text,
  avatar_color_seed text,
  role_self_reported text,
  experience_level text,
  primary_use_cases text[],
  default_locale text default 'en' not null,
  onboarding_completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- workspaces
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon_pattern text default 'circle' not null,
  icon_custom_url text,
  is_private boolean default true not null,
  industry text,
  team_size text,
  owner_id uuid references public.profiles(id) on delete restrict not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- workspace_members
create table public.workspace_members (
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role workspace_role default 'editor' not null,
  joined_at timestamptz default now() not null,
  last_active_at timestamptz,
  primary key (workspace_id, user_id)
);

-- workspace_invitations
create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  email text not null,
  role workspace_role default 'editor' not null,
  invited_by uuid references public.profiles(id) on delete set null,
  token text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz default now() not null
);

-- ========================
-- 4.2 PRD & Editor
-- ========================

-- prd_templates
create table public.prd_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  category text not null,
  structure jsonb not null,
  use_count integer default 0 not null,
  is_built_in boolean default false not null,
  created_at timestamptz default now() not null
);

-- prds
create table public.prds (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  owner_id uuid references public.profiles(id) on delete restrict not null,
  template_id uuid references public.prd_templates(id) on delete set null,
  title text not null,
  project_tag text,
  status prd_status default 'draft' not null,
  content jsonb not null,
  tiptap_content jsonb,
  health_score integer,
  health_breakdown jsonb,
  word_count integer default 0 not null,
  read_time_minutes integer default 0 not null,
  readability_score text,
  current_version integer default 1 not null,
  is_pinned boolean default false not null,
  metadata jsonb default '{}'::jsonb not null,
  archived_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_prds_workspace_status on public.prds(workspace_id, status) where archived_at is null;
create index idx_prds_owner on public.prds(owner_id);
create index idx_prds_updated on public.prds(updated_at desc);

-- LEGACY: prd_sections — not actively used. Content stored in prds.content and prds.tiptap_content.
-- Kept for backward compatibility. Do not build new features on this table.
create table public.prd_sections (
  prd_id uuid references public.prds(id) on delete cascade not null,
  section_key text not null,
  content jsonb not null,
  health_score integer,
  word_count integer default 0 not null,
  updated_at timestamptz default now() not null,
  primary key (prd_id, section_key)
);

-- prd_versions
create table public.prd_versions (
  id uuid primary key default gen_random_uuid(),
  prd_id uuid references public.prds(id) on delete cascade not null,
  version_number integer not null,
  content jsonb not null,
  diff_from_previous jsonb,
  change_summary text,
  created_by uuid references public.profiles(id) on delete set null,
  source text not null,
  ai_run_id uuid,
  created_at timestamptz default now() not null,
  unique (prd_id, version_number)
);

-- comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  prd_id uuid references public.prds(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  is_ai_generated boolean default false not null,
  section_key text,
  selection_range jsonb,
  body text not null,
  reactions jsonb default '{}'::jsonb not null,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  mentions uuid[] default array[]::uuid[],
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_comments_prd on public.comments(prd_id) where resolved_at is null;

-- prd_shares
create table public.prd_shares (
  id uuid primary key default gen_random_uuid(),
  prd_id uuid references public.prds(id) on delete cascade not null,
  share_token text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  view_count integer default 0 not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

-- ========================
-- 4.3 AI Provider & Runs
-- ========================

-- providers
create table public.providers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  type provider_type not null,
  display_name text not null,
  base_url text,
  api_key_encrypted text not null,
  default_model text not null,
  available_models text[] not null default array[]::text[],
  is_default boolean default false not null,
  status provider_status default 'active' not null,
  status_reason text,
  last_used_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create unique index idx_providers_one_default on public.providers(workspace_id) where is_default;

-- safe view that excludes api_key_encrypted
create view public.providers_safe as
  select id, workspace_id, type, display_name, base_url, default_model,
         available_models, is_default, status, status_reason, last_used_at,
         created_by, created_at, updated_at
  from public.providers;

-- ai_runs
create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  prd_id uuid references public.prds(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  provider_id uuid references public.providers(id) on delete set null,
  type ai_run_type not null,
  status ai_run_status default 'queued' not null,
  model_used text not null,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  duration_ms integer,
  cost_credits integer,
  input_payload jsonb,
  output_payload jsonb,
  error_message text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  completed_at timestamptz
);

create index idx_ai_runs_workspace on public.ai_runs(workspace_id, created_at desc);
create index idx_ai_runs_prd on public.ai_runs(prd_id) where prd_id is not null;

-- ai_review_findings
create table public.ai_review_findings (
  id uuid primary key default gen_random_uuid(),
  ai_run_id uuid references public.ai_runs(id) on delete cascade not null,
  prd_id uuid references public.prds(id) on delete cascade not null,
  severity finding_severity not null,
  section_key text not null,
  title text not null,
  description text not null,
  suggested_fix text,
  fix_applied_at timestamptz,
  fix_applied_by uuid references public.profiles(id) on delete set null,
  dismissed_at timestamptz,
  dismissed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- ========================
-- 4.4 Activity, Notifications, Audit
-- ========================

-- activity_log
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete set null,
  type activity_type not null,
  resource_type text,
  resource_id uuid,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);

create index idx_activity_workspace_time on public.activity_log(workspace_id, created_at desc);
create index idx_activity_actor on public.activity_log(actor_id) where actor_id is not null;

-- notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  resource_type text,
  resource_id uuid,
  action_url text,
  read_at timestamptz,
  created_at timestamptz default now() not null
);

create index idx_notifications_recipient_unread on public.notifications(recipient_id) where read_at is null;

-- ========================
-- Helper functions
-- ========================

create or replace function public.has_workspace_role(_workspace_id uuid, _roles workspace_role[])
returns boolean
language sql security definer set search_path = '' as $$
  select exists(
    select 1 from public.workspace_members wm
    where wm.workspace_id = _workspace_id
    and wm.user_id = (select auth.uid())
    and wm.role = any(_roles)
  );
$$;

-- Trigger: auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, avatar_initials, avatar_color_seed)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), 1) ||
          left(split_part(coalesce(new.raw_user_meta_data ->> 'full_name', new.email), ' ', 2), 1)),
    new.id::text
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at auto-update trigger
create or replace function public.update_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.update_updated_at();
create trigger workspaces_updated_at before update on public.workspaces for each row execute procedure public.update_updated_at();
create trigger prds_updated_at before update on public.prds for each row execute procedure public.update_updated_at();
create trigger prd_sections_updated_at before update on public.prd_sections for each row execute procedure public.update_updated_at();
create trigger comments_updated_at before update on public.comments for each row execute procedure public.update_updated_at();
create trigger providers_updated_at before update on public.providers for each row execute procedure public.update_updated_at();
