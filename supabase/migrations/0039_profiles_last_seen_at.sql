alter table public.profiles
add column if not exists last_seen_at timestamptz;

grant select, update on public.profiles to service_role;
