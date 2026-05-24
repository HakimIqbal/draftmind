-- Grant table privileges required by authenticated app flows and service-role PostgREST calls.
-- RLS policies decide row-level access; these grants prevent table-level "permission denied" failures.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prds TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prds TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_runs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prd_sections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prd_sections TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prd_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prd_versions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prd_shares TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prd_shares TO service_role;

GRANT SELECT ON TABLE public.ai_review_findings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_review_findings TO service_role;
