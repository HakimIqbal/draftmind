-- Ensure direct and service-role access for workspace invitations
-- This matches the manual grant applied in Supabase SQL editor.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_invitations TO service_role;
