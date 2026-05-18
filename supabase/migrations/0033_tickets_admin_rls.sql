-- Allow super admins to view all tickets (required for Supabase Realtime to forward INSERT events)
CREATE POLICY "Super admins can view all tickets"
  ON public.tickets FOR SELECT
  USING (
    (SELECT is_super_admin FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

-- Allow super admins to update any ticket (e.g. status changes)
CREATE POLICY "Super admins can update all tickets"
  ON public.tickets FOR UPDATE
  USING (
    (SELECT is_super_admin FROM public.profiles WHERE id = (SELECT auth.uid()))
  );
