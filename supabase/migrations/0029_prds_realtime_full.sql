-- Enable REPLICA IDENTITY FULL on prds so workspace_id filter works for all Realtime event types (including DELETE)
ALTER TABLE public.prds REPLICA IDENTITY FULL;
