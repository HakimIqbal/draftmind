-- Table for Yjs collaborative document persistence (used by y-supabase provider)
CREATE TABLE IF NOT EXISTS public.yjs_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data BYTEA,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: allow authenticated users to read/write their collab documents
ALTER TABLE public.yjs_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "yjs_documents_all" ON public.yjs_documents
  FOR ALL USING (true) WITH CHECK (true);
