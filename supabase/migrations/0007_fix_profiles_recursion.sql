-- Fix infinite recursion in profiles RLS policies
-- The old policies queried profiles FROM profiles policies, causing a loop.
-- Solution: use a SECURITY DEFINER function that bypasses RLS.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = (SELECT auth.uid())),
    false
  );
$$;

-- Drop old recursive policies
DROP POLICY IF EXISTS "Super admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update admin status" ON public.profiles;

-- Recreate with the safe function
CREATE POLICY "Super admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "Super admins can update admin status"
  ON public.profiles FOR UPDATE
  USING (public.is_super_admin());
