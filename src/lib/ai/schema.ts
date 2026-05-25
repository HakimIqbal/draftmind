import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema for generate-prd output (sections only, no metadata)
// Each field has .describe() to guide the LLM on what to generate
// ---------------------------------------------------------------------------
export const AIGeneratedSectionsSchema = z.object({
  overview: z
    .string()
    .describe(
      'Product overview in 1 concise paragraph (4-6 sentences). State what the product is, the core value proposition, key capabilities, and expected impact. Do NOT repeat information that will appear in problem_statement.',
    )
    .optional()
    .default(''),

  problem_statement: z
    .string()
    .describe(
      'Problem statement in 2 paragraphs. First: core issue, root causes, why significant. Second: broader impact, risks of not addressing. ONLY use data from the brief — NEVER fabricate.',
    )
    .optional()
    .default(''),

  objectives: z
    .array(
      z.object({
        statement: z.string().describe('Clear, concise objective statement (1 sentence)'),
        measurable_outcome: z
          .string()
          .describe(
            'Specific key result with baseline→target format. Use data from the brief. If no data provided, use "To be measured → [target]"',
          ),
        priority: z.enum(['must_have', 'should_have', 'nice_to_have']),
      }),
    )
    .describe('4-6 objectives with measurable key results')
    .optional()
    .default([]),

  darci: z
    .object({
      decider: z.object({
        people: z.array(z.string()).describe('ONLY names provided in input. Never invent names.'),
        guidelines: z
          .string()
          .describe(
            '1-2 sentences describing specific decision-making responsibilities for this project',
          ),
      }),
      accountable: z.object({
        people: z.array(z.string()).describe('ONLY names provided in input. Never invent names.'),
        guidelines: z
          .string()
          .describe('1-2 sentences describing delivery accountability for this project'),
      }),
      responsible: z.object({
        people: z
          .array(z.string())
          .describe(
            'ONLY names from input. If not enough people provided, use team names like "Engineering Team", "Design Team"',
          ),
        guidelines: z
          .string()
          .describe('1-2 sentences describing hands-on execution responsibilities'),
      }),
      consulted: z.object({
        people: z
          .array(z.string())
          .describe('ONLY names from input or generic roles like "Stakeholders"'),
        guidelines: z
          .string()
          .describe('1-2 sentences describing consultation role and feedback process'),
      }),
      informed: z.object({
        people: z
          .array(z.string())
          .describe(
            'ONLY names from input or generic groups like "Development Team", "Marketing Team"',
          ),
        guidelines: z
          .string()
          .describe('1-2 sentences describing what updates they receive and how'),
      }),
    })
    .describe('DARCI matrix. CRITICAL: Only use names explicitly provided in the input.')
    .optional(),

  scope: z
    .object({
      in_scope: z
        .array(z.string())
        .describe('6-10 specific features or capabilities included in this project'),
      out_of_scope: z
        .array(z.string())
        .describe(
          '3-5 items explicitly excluded, each with a brief reason (e.g., "iOS app — budget constraint for phase 1")',
        ),
    })
    .optional(),

  user_stories: z
    .array(
      z.object({
        role: z
          .string()
          .describe('User persona/role (e.g., "Driver", "Parking Operator", "Admin")'),
        want: z.string().describe('Specific action the user wants to perform'),
        benefit: z.string().describe('Concrete outcome/benefit for the user'),
        acceptance_criteria: z
          .array(z.string())
          .describe(
            '2-4 testable criteria in Given/When/Then format. Example: "Given the user is on the map, When they tap a slot, Then the booking form appears within 1 second"',
          ),
        priority: z.string().describe('must | should | could').optional(),
      }),
    )
    .describe('5-8 user stories covering different personas and scenarios')
    .optional()
    .default([]),

  functional_reqs: z
    .array(
      z.object({
        priority: z.string().describe('must_have | should_have | nice_to_have'),
        title: z.string().describe('Short requirement title (e.g., "Real-time Parking Map")'),
        description: z
          .string()
          .describe(
            '2-3 sentences describing specific behavior, data handling, and edge cases. Be concrete — mention specific UI elements, API behaviors, or data flows.',
          ),
      }),
    )
    .describe('6-8 functional requirements with detailed behavior descriptions')
    .optional()
    .default([]),

  nfr: z
    .object({
      performance: z
        .string()
        .describe(
          'Specific performance metrics (e.g., "API response < 500ms, page load < 2s, support 1000 concurrent users")',
        )
        .optional(),
      security: z
        .string()
        .describe(
          'Specific security measures (e.g., "AES-256 encryption, OAuth 2.0, RBAC, data encryption at rest")',
        )
        .optional(),
      accessibility: z
        .string()
        .describe(
          'Specific accessibility standards (e.g., "WCAG 2.1 AA, screen reader support, minimum contrast ratio 4.5:1")',
        )
        .optional(),
      scalability: z
        .string()
        .describe(
          'Specific scalability targets (e.g., "support 10K concurrent users, 99.9% uptime, horizontal scaling")',
        )
        .optional(),
    })
    .passthrough()
    .optional(),

  success_metrics: z
    .array(
      z.object({
        name: z.string().describe('Metric name (e.g., "User Retention Rate")'),
        definition: z
          .string()
          .describe('What this metric measures and why it matters (1-2 sentences)')
          .optional(),
        baseline: z
          .string()
          .describe('Current value. Use data from the brief. If unknown, use "To be measured"')
          .optional(),
        target: z.string().describe('Goal value with significance'),
        measurement_window: z
          .string()
          .describe('When to measure (e.g., "After 30 days", "Within 6 months of launch")'),
      }),
    )
    .describe('5-8 success metrics with realistic baselines and targets from the brief')
    .optional()
    .default([]),

  timeline: z
    .array(
      z.object({
        title: z.string().describe('Phase name (e.g., "Planning", "Development", "Testing")'),
        date: z.string().describe('Start date in YYYY-MM-DD format'),
        activity: z
          .string()
          .describe('1-2 sentences describing actionable steps and expected outcomes')
          .optional(),
        deliverable: z
          .union([z.string(), z.array(z.string())])
          .describe('Specific deliverables for this phase')
          .optional(),
        deliverables: z.array(z.string()).optional(),
        pic: z
          .string()
          .describe(
            'Person or team in charge. ONLY use names from input or generic team names like "Engineering Team"',
          )
          .optional(),
      }),
    )
    .describe(
      '5-7 timeline phases distributed across the provided date range. ONLY use names from input for PIC.',
    )
    .optional()
    .default([]),

  risks: z
    .array(
      z.object({
        description: z
          .string()
          .describe('Risk specific to THIS project — not generic project management risks'),
        likelihood: z.enum(['low', 'medium', 'high']),
        impact: z.enum(['low', 'medium', 'high']),
        mitigation: z
          .string()
          .describe(
            'Concrete mitigation steps specific to this risk — not generic "allocate more resources"',
          ),
      }),
    )
    .describe('4-6 risks specific to this project with concrete mitigation strategies')
    .optional()
    .default([]),

  references: z
    .array(
      z.object({
        type: z.string().describe('document | url | other'),
        url: z.string().describe('URL if available, otherwise empty string'),
        title: z.string().describe('Reference title'),
      }),
    )
    .default([]),

  glossary: z
    .array(
      z.object({
        term: z.string().describe('Technical term used in the PRD'),
        definition: z.string().describe('Clear, non-circular definition'),
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
// Schema for template-aware PRD generation output
// ---------------------------------------------------------------------------
export const TemplateGeneratedSectionsSchema = z.object({
  sections: z.array(
    z.object({
      title: z.string().min(1),
      content: z.string().min(1),
    }),
  ),
});

export type TemplateGeneratedSections = z.infer<typeof TemplateGeneratedSectionsSchema>;

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
