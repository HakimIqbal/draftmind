-- Ensure service_role can read prd_templates via PostgREST (bypasses RLS)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON public.prd_templates TO service_role;
