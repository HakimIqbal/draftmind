-- Grant table privileges for the comments table.
-- RLS policies decide row-level access; these grants prevent table-level
-- "permission denied" failures from service_role and authenticated clients
-- (matches the pattern in 0057_grant_prd_ai_flow_permissions.sql).
--
-- Symptom when missing:
--   [COMMENTS] addComment insert failed: {"code":"42501","message":
--   "permission denied for table comments","hint":"GRANT SELECT, INSERT ON
--   public.comments TO service_role;"}

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.comments TO service_role;
