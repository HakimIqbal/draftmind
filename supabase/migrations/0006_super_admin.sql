-- Add is_super_admin field to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false NOT NULL;

-- RLS policy: super admins can read all profiles
CREATE POLICY "Super admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT is_super_admin FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

-- RLS policy: super admins can update is_super_admin on other profiles
CREATE POLICY "Super admins can update admin status"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT is_super_admin FROM public.profiles WHERE id = (SELECT auth.uid()))
  );
