-- Allow workspace members to insert AI runs (needed for PRD generation)
CREATE POLICY "Members can create AI runs"
  ON public.ai_runs FOR INSERT
  WITH CHECK (
    public.has_workspace_role(workspace_id, ARRAY['admin', 'editor']::workspace_role[])
  );

-- Allow members to update their own AI runs (for status updates)
CREATE POLICY "Members can update AI runs"
  ON public.ai_runs FOR UPDATE
  USING (
    public.has_workspace_role(workspace_id, ARRAY['admin', 'editor']::workspace_role[])
  );
