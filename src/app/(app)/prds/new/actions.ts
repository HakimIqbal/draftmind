'use server';

import { requireUser } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { createEmptyPRD } from '@/lib/prd/schema';
import { redirect } from 'next/navigation';

export async function getTemplates() {
  await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from('prd_templates')
    .select('id, name, description, category, structure, is_built_in')
    .order('use_count', { ascending: false });

  return (data ?? []) as {
    id: string;
    name: string;
    description: string | null;
    category: string;
    structure: { sections_enabled?: string[]; sections?: { name: string; guidelines: string }[] };
    is_built_in: boolean;
  }[];
}

export async function getWorkspaceMembers(workspaceId: string) {
  await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from('workspace_members')
    .select('user_id, role, profile:profiles(full_name, email)')
    .eq('workspace_id', workspaceId);

  return (data ?? []).map((m) => {
    const profile = m.profile as unknown as { full_name: string | null; email: string } | null;
    return {
      id: m.user_id,
      name: profile?.full_name ?? profile?.email ?? 'Unknown',
      email: profile?.email ?? '',
      role: m.role,
    };
  });
}

export async function createPRDAndGenerate(data: {
  workspaceId: string;
  userId: string;
  title: string;
  projectTag: string;
  brief: string;
  startDate: string;
  endDate: string;
  stakeholders?: string;
  teamMemberIds?: string[];
  teamMemberNames?: string[];
  problemStatement?: string;
  targetUsers?: string;
  constraints?: string;
  successCriteria?: string;
  platform?: string;
  priority?: string;
  techStack?: string;
  designLink?: string;
}) {
  await requireUser();
  const supabase = await createClient();
  const emptyPRD = createEmptyPRD(data.userId, data.title);

  const { data: prd, error } = await supabase
    .from('prds')
    .insert({
      workspace_id: data.workspaceId,
      owner_id: data.userId,
      title: data.title,
      project_tag: data.projectTag,
      status: 'draft',
      content: emptyPRD,
      metadata: {
        start_date: data.startDate,
        end_date: data.endDate,
        stakeholders: data.stakeholders,
        team_member_ids: data.teamMemberIds,
        team_member_names: data.teamMemberNames,
        problem_statement: data.problemStatement,
        target_users: data.targetUsers,
        constraints: data.constraints,
        success_criteria: data.successCriteria,
        platform: data.platform,
        priority: data.priority,
        tech_stack: data.techStack,
        design_link: data.designLink,
      },
    })
    .select('id')
    .single();

  if (error || !prd) throw new Error('Failed to create PRD');

  await supabase.from('ai_runs').insert({
    workspace_id: data.workspaceId,
    prd_id: prd.id,
    user_id: data.userId,
    type: 'generate_prd',
    status: 'queued',
    model_used: 'pending',
    input_payload: {
      brief: data.brief,
      title: data.title,
      project_tag: data.projectTag,
      stakeholders: data.stakeholders,
      team_members: data.teamMemberNames,
      problem_statement: data.problemStatement,
      target_users: data.targetUsers,
      constraints: data.constraints,
      success_criteria: data.successCriteria,
      platform: data.platform,
      priority: data.priority,
      tech_stack: data.techStack,
      design_link: data.designLink,
    },
  });

  redirect(`/prds/${prd.id}?generating=true`);
}

export async function createPRDFromTemplate(data: {
  workspaceId: string;
  userId: string;
  title: string;
  projectTag?: string;
  templateId: string;
  brief: string;
}) {
  await requireUser();
  const supabase = await createClient();

  const { data: template } = await supabase
    .from('prd_templates')
    .select('id, name, structure')
    .eq('id', data.templateId)
    .single();

  if (!template) throw new Error('Template not found');

  const emptyPRD = createEmptyPRD(data.userId, data.title);

  const { data: prd, error } = await supabase
    .from('prds')
    .insert({
      workspace_id: data.workspaceId,
      owner_id: data.userId,
      template_id: data.templateId,
      title: data.title,
      project_tag: data.projectTag || null,
      status: 'draft',
      content: emptyPRD,
    })
    .select('id')
    .single();

  if (error || !prd) throw new Error('Failed to create PRD');

  // Create AI run to generate content based on template
  await supabase.from('ai_runs').insert({
    workspace_id: data.workspaceId,
    prd_id: prd.id,
    user_id: data.userId,
    type: 'generate_prd',
    status: 'queued',
    model_used: 'pending',
    input_payload: {
      brief: data.brief,
      title: data.title,
      project_tag: data.projectTag,
      template_id: data.templateId,
      template_name: template.name,
      template_sections: (
        template.structure as { sections?: { name: string; guidelines: string }[] }
      ).sections,
    },
  });

  // Increment use count
  const { data: currentTemplate } = await supabase
    .from('prd_templates')
    .select('use_count')
    .eq('id', data.templateId)
    .single();
  if (currentTemplate) {
    await supabase
      .from('prd_templates')
      .update({ use_count: (currentTemplate.use_count ?? 0) + 1 })
      .eq('id', data.templateId);
  }

  redirect(`/prds/${prd.id}?generating=true`);
}
