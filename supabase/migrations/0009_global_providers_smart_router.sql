-- Make providers global (remove workspace requirement) and add smart routing

-- Add priority and use_for columns
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS priority integer DEFAULT 1 NOT NULL;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS use_for text DEFAULT 'all' NOT NULL;

-- Make workspace_id nullable (global providers don't need workspace)
ALTER TABLE public.providers ALTER COLUMN workspace_id DROP NOT NULL;

-- Add request tracking columns
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS total_requests integer DEFAULT 0 NOT NULL;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS successful_requests integer DEFAULT 0 NOT NULL;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS failed_requests integer DEFAULT 0 NOT NULL;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS avg_latency_ms integer DEFAULT 0 NOT NULL;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS last_used_at timestamptz;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS last_error text;
