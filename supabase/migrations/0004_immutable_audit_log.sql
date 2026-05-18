-- Prevent UPDATE/DELETE on activity_log
CREATE OR REPLACE FUNCTION prevent_activity_log_mutation()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'activity_log is immutable: % not allowed', TG_OP;
END;
$$;

CREATE TRIGGER activity_log_immutable
  BEFORE UPDATE OR DELETE ON public.activity_log
  FOR EACH ROW EXECUTE FUNCTION prevent_activity_log_mutation();
