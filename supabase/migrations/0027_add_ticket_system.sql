-- Add missing notification_type enum values
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'status_changed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ticket_update';

-- Ticket system
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL CHECK (category IN ('bug', 'access', 'password', 'question', 'other')),
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON public.tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX tickets_user_id_idx ON public.tickets(user_id);
CREATE INDEX tickets_status_idx ON public.tickets(status);
CREATE INDEX tickets_created_at_idx ON public.tickets(created_at DESC);
