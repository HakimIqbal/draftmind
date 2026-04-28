'use server';

import { createClient } from '@/lib/supabase/server';

export async function savePRDContent(prdId: string, tiptapContent: Record<string, unknown>) {
  const supabase = await createClient();
  await supabase
    .from('prds')
    .update({
      tiptap_content: tiptapContent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', prdId);
}
