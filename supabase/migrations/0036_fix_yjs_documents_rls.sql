-- Fix yjs_documents RLS: USING (true) allows any authenticated user to read/write
-- all documents. Since the table has no prd_id FK, add the column + workspace-aware policy.

-- Drop existing permissive policy
DROP POLICY IF EXISTS "yjs_documents_all" ON public.yjs_documents;

-- Add prd_id as nullable FK so documents can be linked to a PRD
ALTER TABLE public.yjs_documents
  ADD COLUMN IF NOT EXISTS prd_id UUID REFERENCES public.prds(id) ON DELETE CASCADE;

-- Rows without prd_id are inaccessible (orphaned legacy rows)
-- New workspace-aware policy
CREATE POLICY "yjs_documents_workspace_members" ON public.yjs_documents
FOR ALL
USING (
  prd_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.prds
    WHERE prds.id = yjs_documents.prd_id
    AND public.has_workspace_role(
      prds.workspace_id,
      ARRAY['admin','editor','commenter','viewer']::public.workspace_role[]
    )
  )
)
WITH CHECK (
  prd_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.prds
    WHERE prds.id = yjs_documents.prd_id
    AND public.has_workspace_role(
      prds.workspace_id,
      ARRAY['admin','editor']::public.workspace_role[]
    )
  )
);
