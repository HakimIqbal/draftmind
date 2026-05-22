create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  target text not null check (target in ('all', 'role', 'user')),
  target_value text,
  recipient_count integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null
);

alter table public.announcements enable row level security;

create index if not exists idx_announcements_created_at
  on public.announcements(created_at desc);

create index if not exists idx_announcements_deleted_at
  on public.announcements(deleted_at)
  where deleted_at is null;
