-- Enable Realtime for workspaces table (new) and add REPLICA IDENTITY FULL to both tables
-- so admin panel reflects workspace and member changes without reload
ALTER TABLE public.workspaces REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspaces;

ALTER TABLE public.workspace_members REPLICA IDENTITY FULL;
