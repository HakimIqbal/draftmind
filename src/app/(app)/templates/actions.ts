'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { createClient } from '@/lib/supabase/server';

export interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  sections: string[];
  guidelines: Record<string, string>;
}

export async function createTemplate(data: TemplateFormData) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return { error: 'No workspace found' };

  const supabase = await createClient();

  const structure = {
    sections: data.sections.map((key) => ({
      name: key,
      guidelines: data.guidelines[key] || '',
    })),
  };

  const { error } = await supabase.from('prd_templates').insert({
    workspace_id: workspace.id,
    name: data.name,
    description: data.description || null,
    category: data.category,
    structure,
    is_built_in: false,
  });

  if (error) return { error: error.message };

  revalidatePath('/templates');
  return { success: true };
}

export async function updateTemplate(templateId: string, data: Partial<TemplateFormData>) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return { error: 'No workspace found' };

  const supabase = await createClient();

  // Verify ownership — only custom workspace templates can be edited
  const { data: existing } = await supabase
    .from('prd_templates')
    .select('id, workspace_id, is_built_in')
    .eq('id', templateId)
    .single();

  if (!existing) return { error: 'Template not found' };
  if (existing.is_built_in) return { error: 'Cannot edit built-in templates' };
  if (existing.workspace_id !== workspace.id) return { error: 'Permission denied' };

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description || null;
  if (data.category !== undefined) updates.category = data.category;
  if (data.sections !== undefined) {
    const gl = data.guidelines ?? {};
    updates.structure = {
      sections: data.sections.map((key) => ({
        name: key,
        guidelines: gl[key] || '',
      })),
    };
  }

  const { error } = await supabase.from('prd_templates').update(updates).eq('id', templateId);

  if (error) return { error: error.message };

  revalidatePath('/templates');
  return { success: true };
}

export async function deleteTemplate(templateId: string) {
  const user = await requireUser();
  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return { error: 'No workspace found' };

  const supabase = await createClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from('prd_templates')
    .select('id, workspace_id, is_built_in')
    .eq('id', templateId)
    .single();

  if (!existing) return { error: 'Template not found' };
  if (existing.is_built_in) return { error: 'Cannot delete built-in templates' };
  if (existing.workspace_id !== workspace.id) return { error: 'Permission denied' };

  const { error } = await supabase.from('prd_templates').delete().eq('id', templateId);

  if (error) return { error: error.message };

  revalidatePath('/templates');
  return { success: true };
}
