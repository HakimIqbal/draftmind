-- Allow workspace deletion while preserving immutable audit history.
-- Existing activity_log.workspace_id was NOT NULL with ON DELETE CASCADE, but
-- activity_log is immutable and blocks DELETE, so deleting a workspace failed.
-- Make workspace_id nullable + SET NULL, and allow only this narrow detach update.

ALTER TABLE public.activity_log
  DROP CONSTRAINT IF EXISTS activity_log_workspace_id_fkey;

ALTER TABLE public.activity_log
  ALTER COLUMN workspace_id DROP NOT NULL;

ALTER TABLE public.activity_log
  ADD CONSTRAINT activity_log_workspace_id_fkey
  FOREIGN KEY (workspace_id)
  REFERENCES public.workspaces(id)
  ON DELETE SET NULL;


-- Explicit grants for the tables used by workspace settings/delete server actions.
-- RLS still controls authenticated users; service_role must be able to perform
-- constrained maintenance writes used by server-side admin actions.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.activity_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_log TO service_role;

CREATE OR REPLACE FUNCTION prevent_activity_log_mutation()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.workspace_id IS NOT NULL
       AND NEW.workspace_id IS NULL
       AND (to_jsonb(NEW) - 'workspace_id') = (to_jsonb(OLD) - 'workspace_id') THEN
      RETURN NEW;
    END IF;
  END IF;

  RAISE EXCEPTION 'activity_log is immutable: % not allowed', TG_OP;
END;
$$;
