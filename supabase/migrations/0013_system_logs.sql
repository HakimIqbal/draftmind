-- System logs for admin monitoring
-- Stores all system errors, warnings, and events that should NOT be shown to users

create table public.system_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('error', 'warn', 'info')),
  source text not null,
  message text not null,
  metadata jsonb default '{}'::jsonb not null,
  user_id uuid references public.profiles(id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz default now() not null
);

create index idx_system_logs_created on public.system_logs(created_at desc);
create index idx_system_logs_level on public.system_logs(level) where level = 'error';

-- RLS: only service role can insert/read (admin only)
alter table public.system_logs enable row level security;

-- No user-facing policies — only accessible via service role (admin client)
