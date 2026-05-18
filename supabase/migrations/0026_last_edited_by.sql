ALTER TABLE public.prds
  ADD COLUMN IF NOT EXISTS last_edited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
