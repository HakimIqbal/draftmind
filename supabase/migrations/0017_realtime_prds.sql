-- Enable realtime for prds table so dashboard auto-updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.prds;
