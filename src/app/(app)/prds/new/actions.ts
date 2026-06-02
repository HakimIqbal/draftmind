'use server';

import { requireUser } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createEmptyPRD } from '@/lib/prd/schema';
import { redirect } from 'next/navigation';
import { logActivity } from '@/lib/logging/activity-log';
import { logInfo } from '@/lib/logging/system-log';

type TemplateSectionInput = {
  name?: unknown;
  title?: unknown;
  guidelines?: unknown;
  description?: unknown;
};
type TemplateStructure = {
  sections?: TemplateSectionInput[];
  sections_enabled?: unknown[];
  instructions?: string;
};

function normalizeTemplateSections(structure: TemplateStructure | null | undefined) {
  const sections = Array.isArray(structure?.sections)
    ? structure!.sections
        .map((section) => ({
          name: String(section.name ?? section.title ?? '').trim(),
          guidelines: String(section.guidelines ?? section.description ?? '').trim(),
        }))
        .filter((section) => section.name.length > 0)
    : [];

  if (sections.length > 0) return sections;

  if (Array.isArray(structure?.sections_enabled)) {
    return structure!.sections_enabled
      .map((name) => ({ name: String(name ?? '').trim(), guidelines: '' }))
      .filter((section) => section.name.length > 0);
  }

  return [];
}

const INVALID_TEMPLATE_MESSAGE =
  'This template has no sections configured. Please edit the template or choose another template.';

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
    structure: {
      sections_enabled?: string[];
      sections?: { name: string; guidelines: string }[];
      instructions?: string;
    };
    is_built_in: boolean;
  }[];
}

export async function getWorkspaceMembers(workspaceId: string, currentUserId?: string) {
  await requireUser();
  const admin = createAdminClient();

  const { data } = await admin
    .from('workspace_members')
    .select('user_id, role, profile:profiles(full_name, email, role_self_reported)')
    .eq('workspace_id', workspaceId);

  const members = (data ?? []).map((m) => {
    const profile = m.profile as unknown as {
      full_name: string | null;
      email: string;
      role_self_reported: string | null;
    } | null;
    return {
      id: m.user_id,
      name: profile?.full_name ?? profile?.email ?? 'Unknown',
      email: profile?.email ?? '',
      role: profile?.role_self_reported ?? m.role, // profesi role, fallback to workspace role
      roleProfesi: profile?.role_self_reported ?? null,
    };
  });

  // If workspace has no other members, include the current user as a developer option
  // This allows solo workspaces to create PRDs
  if (members.length === 0 && currentUserId) {
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', currentUserId)
      .single();

    if (profile) {
      members.push({
        id: currentUserId,
        name: profile.full_name ?? profile.email ?? 'You',
        email: profile.email ?? '',
        role: 'Member',
        roleProfesi: null,
      });
    }
  }

  return members;
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
  teamMemberRoles?: string[]; // role profesi
  problemStatement?: string;
  targetUsers?: string;
  constraints?: string;
  successCriteria?: string;
  platform?: string;
  priority?: string;
  techStack?: string;
  designLink?: string;
  templateId?: string;
  templateName?: string;
  preferredProviderId?: string;
}) {
  const user = await requireUser();
  const authenticatedUserId = user.id;
  const supabase = await createClient();
  const admin = createAdminClient();
  const emptyPRD = createEmptyPRD(authenticatedUserId, data.title);

  const generationMode = data.templateId ? 'template' : 'standard';

  // If template selected, fetch and validate its structure for AI context.
  let templateSections: { name: string; guidelines: string }[] | undefined;
  let templateInstructions: string | undefined;
  if (data.templateId) {
    const { data: template, error: templateError } = await supabase
      .from('prd_templates')
      .select('structure')
      .eq('id', data.templateId)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found. Please choose another template.');
    }

    const structure = template.structure as TemplateStructure;
    templateSections = normalizeTemplateSections(structure);
    templateInstructions =
      typeof structure.instructions === 'string' ? structure.instructions : undefined;

    if (templateSections.length === 0) {
      throw new Error(INVALID_TEMPLATE_MESSAGE);
    }

    // Increment use count only after the template is proven valid.
    const { data: current } = await admin
      .from('prd_templates')
      .select('use_count')
      .eq('id', data.templateId)
      .single();
    if (current) {
      await admin
        .from('prd_templates')
        .update({ use_count: (current.use_count ?? 0) + 1 })
        .eq('id', data.templateId);
    }
  }

  const { data: prd, error } = await admin
    .from('prds')
    .insert({
      workspace_id: data.workspaceId,
      owner_id: authenticatedUserId,
      template_id: data.templateId ?? null,
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
        generation_mode: generationMode,
        template_id: data.templateId ?? null,
        template_name: data.templateName,
        template_sections: templateSections,
      },
    })
    .select('id')
    .single();

  if (error || !prd) {
    logInfo(
      'prd.create',
      `Failed to create PRD: ${error?.message ?? 'unknown error'}`,
      { workspaceId: data.workspaceId, title: data.title },
      authenticatedUserId,
    );
    throw new Error(error?.message ?? 'Failed to create PRD');
  }

  await logActivity({
    workspaceId: data.workspaceId,
    actorId: authenticatedUserId,
    type: 'prd_created',
    resourceType: 'prd',
    resourceId: prd.id,
    metadata: { title: data.title, template_id: data.templateId ?? null },
  });
  logInfo(
    'prd.create',
    `PRD created: '${data.title}'`,
    { prdId: prd.id, workspaceId: data.workspaceId },
    authenticatedUserId,
  );

  const { error: aiRunError } = await admin.from('ai_runs').insert({
    workspace_id: data.workspaceId,
    prd_id: prd.id,
    user_id: authenticatedUserId,
    type: 'generate_prd',
    status: 'queued',
    model_used: 'pending',
    input_payload: {
      brief: data.brief,
      title: data.title,
      project_tag: data.projectTag,
      start_date: data.startDate,
      end_date: data.endDate,
      stakeholders: data.stakeholders,
      team_members: data.teamMemberNames,
      team_member_roles: data.teamMemberRoles,
      problem_statement: data.problemStatement,
      target_users: data.targetUsers,
      constraints: data.constraints,
      success_criteria: data.successCriteria,
      platform: data.platform,
      priority: data.priority,
      tech_stack: data.techStack,
      design_link: data.designLink,
      template_id: data.templateId,
      template_name: data.templateName,
      template_sections: templateSections,
      template_instructions: templateInstructions,
      generation_mode: generationMode,
      preferred_provider_id: data.preferredProviderId,
    },
  });

  if (aiRunError) {
    logInfo(
      'prd.create',
      `Failed to queue AI run: ${aiRunError.message}`,
      { workspaceId: data.workspaceId, title: data.title },
      authenticatedUserId,
    );
    throw new Error(aiRunError.message ?? 'Failed to queue PRD generation');
  }

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
  const user = await requireUser();
  const authenticatedUserId = user.id;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from('prd_templates')
    .select('id, name, structure')
    .eq('id', data.templateId)
    .single();

  if (!template) throw new Error('Template not found');

  const emptyPRD = createEmptyPRD(authenticatedUserId, data.title);

  const { data: prd, error } = await supabase
    .from('prds')
    .insert({
      workspace_id: data.workspaceId,
      owner_id: authenticatedUserId,
      template_id: data.templateId,
      title: data.title,
      project_tag: data.projectTag || null,
      status: 'draft',
      content: emptyPRD,
    })
    .select('id')
    .single();

  if (error || !prd) throw new Error('Failed to create PRD');

  await logActivity({
    workspaceId: data.workspaceId,
    actorId: authenticatedUserId,
    type: 'prd_created',
    resourceType: 'prd',
    resourceId: prd.id,
    metadata: { title: data.title, template_id: data.templateId, from_template: true },
  });

  // Create AI run to generate content based on template
  const { error: aiRunError } = await supabase.from('ai_runs').insert({
    workspace_id: data.workspaceId,
    prd_id: prd.id,
    user_id: authenticatedUserId,
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

  if (aiRunError) throw new Error('Failed to queue PRD generation');

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
