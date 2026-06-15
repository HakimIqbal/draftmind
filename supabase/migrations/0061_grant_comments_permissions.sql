-- Grant permissions for comments table
-- Fixes: permission denied for table comments error

-- Grant to authenticated role (for SELECT queries)
GRANT SELECT ON TABLE public.comments TO authenticated;

-- Grant to service_role (for INSERT/UPDATE/DELETE via admin client)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.comments TO service_role;

-- Grant for realtime subscription (postgres_changes)
-- The anon and authenticated roles need SELECT to subscribe to changes
GRANT SELECT ON TABLE public.comments TO anon;
GRANT SELECT ON TABLE public.comments TO authenticated;

-- Also ensure the profiles table has proper grants for comment author lookups
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.profiles TO service_role;

-- Verify grants
SELECT 
  'comments' as table_name,
  array_agg(DISTINCT grantee) as who_has_access,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_name = 'comments'
GROUP BY table_name, privilege_type;
