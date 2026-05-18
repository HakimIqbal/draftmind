-- Replace raw subquery with SECURITY DEFINER function for Realtime compatibility.
-- The raw subquery hits profiles (which also has RLS), causing Realtime to block events
-- even for super admins. The SECURITY DEFINER function bypasses profiles RLS.

DROP POLICY IF EXISTS "Super admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Super admins can update all tickets" ON public.tickets;

CREATE POLICY "Super admins can view all tickets"
  ON public.tickets FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "Super admins can update all tickets"
  ON public.tickets FOR UPDATE
  USING (public.is_super_admin());
