import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema for generate-prd output (sections only, no metadata)
// ---------------------------------------------------------------------------
export const AIGeneratedSectionsSchema = z.object({
  overview: z.string(),
  problem_statement: z.string(),
  objectives: z.array(
    z.object({
      statement: z.string(),
      measurable_outcome: z.string(),
      priority: z.enum(['must_have', 'should_have', 'nice_to_have']),
    }),
  ),
  darci: z.object({
    decider: z
      .union([
        z.string(),
        z.object({ people: z.array(z.string()), guidelines: z.string().default('') }),
      ])
      .optional(),
    accountable: z
      .union([
        z.string(),
        z.object({ people: z.array(z.string()), guidelines: z.string().default('') }),
      ])
      .optional(),
    responsible: z.union([
      z.array(z.string()),
      z.object({ people: z.array(z.string()), guidelines: z.string().default('') }),
    ]),
    consulted: z.union([
      z.array(z.string()),
      z.object({ people: z.array(z.string()), guidelines: z.string().default('') }),
    ]),
    informed: z.union([
      z.array(z.string()),
      z.object({ people: z.array(z.string()), guidelines: z.string().default('') }),
    ]),
  }),
  scope: z.object({
    in_scope: z.array(z.string()),
    out_of_scope: z.array(z.string()),
  }),
  user_stories: z.array(
    z.object({
      role: z.string(),
      want: z.string(),
      benefit: z.string(),
      acceptance_criteria: z.array(z.string()),
      priority: z.string().optional(),
    }),
  ),
  functional_reqs: z.array(
    z.object({
      priority: z.string(),
      title: z.string(),
      description: z.string(),
    }),
  ),
  nfr: z
    .object({
      performance: z.string().optional(),
      security: z.string().optional(),
      accessibility: z.string().optional(),
      scalability: z.string().optional(),
    })
    .passthrough(),
  success_metrics: z.array(
    z.object({
      name: z.string(),
      definition: z.string().optional(),
      baseline: z.string().optional(),
      target: z.string(),
      measurement_window: z.string(),
    }),
  ),
  timeline: z.array(
    z.object({
      title: z.string(),
      date: z.string(),
      activity: z.string().optional(),
      deliverable: z.union([z.string(), z.array(z.string())]).optional(),
      deliverables: z.array(z.string()).optional(),
      pic: z.string().optional(),
    }),
  ),
  risks: z.array(
    z.object({
      description: z.string(),
      likelihood: z.enum(['low', 'medium', 'high']),
      impact: z.enum(['low', 'medium', 'high']),
      mitigation: z.string(),
    }),
  ),
  references: z
    .array(
      z.object({
        type: z.string(),
        url: z.string(),
        title: z.string(),
      }),
    )
    .default([]),
  glossary: z
    .array(
      z.object({
        term: z.string(),
        definition: z.string(),
      }),
    )
    .default([]),
  changelog: z
    .array(
      z.object({
        version: z.number(),
        date: z.string(),
        author: z.string(),
        summary: z.string(),
      }),
    )
    .default([]),
});

export type AIGeneratedSections = z.infer<typeof AIGeneratedSectionsSchema>;

// ---------------------------------------------------------------------------
// Schema for AI review output
// ---------------------------------------------------------------------------
export const AIReviewOutputSchema = z.object({
  health_score: z.number().min(0).max(100),
  breakdown: z.object({
    completeness: z.number(),
    specificity: z.number(),
    structural: z.number(),
    consistency: z.number(),
  }),
  summary: z.string(),
  findings: z.array(
    z.object({
      severity: z.enum(['high', 'medium', 'low']),
      section_key: z.string(),
      title: z.string(),
      description: z.string(),
      suggested_fix: z.string().optional(),
    }),
  ),
});

export type AIReviewOutput = z.infer<typeof AIReviewOutputSchema>;

// ---------------------------------------------------------------------------
// Schema for inline suggest output
// ---------------------------------------------------------------------------
export const AIInlineSuggestSchema = z.object({
  suggestions: z.array(
    z.object({
      text: z.string(),
      rationale: z.string(),
    }),
  ),
});

export type AIInlineSuggestOutput = z.infer<typeof AIInlineSuggestSchema>;
