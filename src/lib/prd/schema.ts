import { z } from 'zod';

// --- Base schemas ---

const TiptapContentSchema = z
  .object({
    type: z.literal('doc'),
    content: z.array(z.record(z.unknown())),
  })
  .passthrough();

const PRDRichTextSchema = z.object({
  content: TiptapContentSchema,
  word_count: z.number().default(0),
  ai_generated: z.boolean().default(false),
  last_edited_by: z.string().uuid().optional(),
  last_edited_at: z.string().optional(),
});

// --- Section sub-schemas ---

export const PRDObjectiveSchema = z.object({
  id: z.string(),
  type: z.enum(['goal', 'non-goal']),
  description: z.string(),
  key_results: z.array(z.string()).default([]),
});

export const PRDDarciRoleSchema = z.object({
  people: z.array(z.string()).default([]),
  guidelines: z.string().default(''),
});

export const PRDDarciMatrixSchema = z.object({
  decider: z.union([z.array(z.string()), PRDDarciRoleSchema]).default([]),
  accountable: z.union([z.array(z.string()), PRDDarciRoleSchema]).default([]),
  responsible: z.union([z.array(z.string()), PRDDarciRoleSchema]).default([]),
  consulted: z.union([z.array(z.string()), PRDDarciRoleSchema]).default([]),
  informed: z.union([z.array(z.string()), PRDDarciRoleSchema]).default([]),
});

export const PRDScopeSchema = z.object({
  in_scope: z.array(z.string()).default([]),
  out_of_scope: z.array(z.string()).default([]),
});

export const PRDUserStorySchema = z.object({
  id: z.string(),
  role: z.string(),
  want: z.string(),
  benefit: z.string(),
  acceptance_criteria: z.array(z.string()).default([]),
  priority: z.enum(['must', 'should', 'could', 'wont']).default('should'),
});

export const PRDRequirementSchema = z.object({
  id: z.string(),
  priority: z.enum(['must', 'should', 'could', 'wont']).default('must'),
  title: z.string(),
  description: z.string(),
  dependencies: z.array(z.string()).default([]),
});

export const PRDNFRSchema = z.object({
  performance: z.array(z.string()).default([]),
  security: z.array(z.string()).default([]),
  accessibility: z.array(z.string()).default([]),
  scalability: z.array(z.string()).default([]),
  reliability: z.array(z.string()).default([]),
  compliance: z.array(z.string()).default([]),
});

export const PRDMetricSchema = z.object({
  id: z.string(),
  name: z.string(),
  definition: z.string().default(''),
  baseline: z.string(),
  target: z.string(),
  measurement_window: z.string(),
  owner: z.string().optional(),
});

export const PRDMilestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  activity: z.string().default(''),
  deliverables: z.array(z.string()).default([]),
  pic: z.string().optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'delayed']).default('planned'),
});

export const PRDRiskSchema = z.object({
  id: z.string(),
  description: z.string(),
  likelihood: z.enum(['low', 'medium', 'high']),
  impact: z.enum(['low', 'medium', 'high']),
  mitigation: z.string(),
  owner: z.string().optional(),
});

export const PRDReferenceSchema = z.object({
  id: z.string(),
  type: z.enum(['document', 'url', 'figma', 'jira', 'slack', 'other']),
  url: z.string(),
  title: z.string(),
  description: z.string().optional(),
});

export const PRDGlossaryEntrySchema = z.object({
  term: z.string(),
  definition: z.string(),
});

export const PRDChangelogEntrySchema = z.object({
  version: z.number(),
  date: z.string(),
  author: z.string(),
  summary: z.string(),
});

// --- Final document schema ---

export const PRDDocumentSchema = z.object({
  version: z.literal(1),
  metadata: z.object({
    title: z.string(),
    project_tag: z.string().optional(),
    owner_id: z.string().uuid(),
    owner_name: z.string().optional(),
    developers: z.array(z.object({ name: z.string(), role: z.string() })).default([]),
    stakeholder_names: z.array(z.string()).default([]),
    stakeholders: z.array(z.string().uuid()).default([]),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    template_id: z.string().uuid().optional(),
    locale: z.enum(['en', 'id', 'mixed']).default('mixed'),
  }),
  sections: z.object({
    overview: PRDRichTextSchema,
    problem_statement: PRDRichTextSchema,
    objectives: z.array(PRDObjectiveSchema).default([]),
    darci: PRDDarciMatrixSchema,
    scope: PRDScopeSchema,
    user_stories: z.array(PRDUserStorySchema).default([]),
    functional_reqs: z.array(PRDRequirementSchema).default([]),
    nfr: PRDNFRSchema,
    success_metrics: z.array(PRDMetricSchema).default([]),
    timeline: z.array(PRDMilestoneSchema).default([]),
    risks: z.array(PRDRiskSchema).default([]),
    references: z.array(PRDReferenceSchema).default([]),
    glossary: z.array(PRDGlossaryEntrySchema).default([]),
    changelog: z.array(PRDChangelogEntrySchema).default([]),
  }),
});

// --- Inferred types ---

export type PRDDocument = z.infer<typeof PRDDocumentSchema>;
export type PRDRichText = z.infer<typeof PRDRichTextSchema>;
export type PRDObjective = z.infer<typeof PRDObjectiveSchema>;
export type PRDDarciMatrix = z.infer<typeof PRDDarciMatrixSchema>;
export type PRDScope = z.infer<typeof PRDScopeSchema>;
export type PRDUserStory = z.infer<typeof PRDUserStorySchema>;
export type PRDRequirement = z.infer<typeof PRDRequirementSchema>;
export type PRDNFR = z.infer<typeof PRDNFRSchema>;
export type PRDMetric = z.infer<typeof PRDMetricSchema>;
export type PRDMilestone = z.infer<typeof PRDMilestoneSchema>;
export type PRDRisk = z.infer<typeof PRDRiskSchema>;
export type PRDReference = z.infer<typeof PRDReferenceSchema>;
export type PRDGlossaryEntry = z.infer<typeof PRDGlossaryEntrySchema>;
export type PRDChangelogEntry = z.infer<typeof PRDChangelogEntrySchema>;
export type TiptapContent = z.infer<typeof TiptapContentSchema>;

// --- Factory ---

function createEmptyRichText(): PRDRichText {
  return {
    content: { type: 'doc', content: [] },
    word_count: 0,
    ai_generated: false,
  };
}

export function createEmptyPRD(ownerId: string, title: string): PRDDocument {
  return {
    version: 1,
    metadata: {
      title,
      owner_id: ownerId,
      developers: [],
      stakeholder_names: [],
      stakeholders: [],
      locale: 'mixed',
    },
    sections: {
      overview: createEmptyRichText(),
      problem_statement: createEmptyRichText(),
      objectives: [],
      darci: {
        decider: { people: [], guidelines: '' },
        accountable: { people: [], guidelines: '' },
        responsible: { people: [], guidelines: '' },
        consulted: { people: [], guidelines: '' },
        informed: { people: [], guidelines: '' },
      },
      scope: { in_scope: [], out_of_scope: [] },
      user_stories: [],
      functional_reqs: [],
      nfr: {
        performance: [],
        security: [],
        accessibility: [],
        scalability: [],
        reliability: [],
        compliance: [],
      },
      success_metrics: [],
      timeline: [],
      risks: [],
      references: [],
      glossary: [],
      changelog: [],
    },
  };
}
