-- Allow users to update their own last_active_at
CREATE POLICY "Members can update own last_active_at"
  ON public.workspace_members
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
