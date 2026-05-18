-- Enable Realtime for profiles table so admin panel reflects profile changes (avatar, name, status) without reload
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
