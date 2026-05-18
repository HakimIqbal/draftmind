-- Enable REPLICA IDENTITY FULL on comments so prd_id filter works for DELETE events in Realtime subscriptions
ALTER TABLE public.comments REPLICA IDENTITY FULL;
