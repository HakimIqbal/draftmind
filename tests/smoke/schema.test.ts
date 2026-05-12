import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate the core AI schema validation to test without server-only imports
const AIGeneratedSectionsSchema = z.object({
  overview: z.string().optional().default(''),
  problem_statement: z.string().optional().default(''),
  objectives: z
    .array(
      z.object({
        statement: z.string(),
        measurable_outcome: z.string(),
        priority: z.enum(['must_have', 'should_have', 'nice_to_have']),
      }),
    )
    .optional()
    .default([]),
  scope: z
    .object({
      in_scope: z.array(z.string()),
      out_of_scope: z.array(z.string()),
    })
    .optional(),
  user_stories: z
    .array(
      z.object({
        role: z.string(),
        want: z.string(),
        benefit: z.string(),
        acceptance_criteria: z.array(z.string()),
      }),
    )
    .optional()
    .default([]),
  success_metrics: z
    .array(
      z.object({
        name: z.string(),
        target: z.string(),
        measurement_window: z.string(),
      }),
    )
    .optional()
    .default([]),
});

describe('PRD Schema - Zod Validation', () => {
  it('accepts valid complete PRD data', () => {
    const result = AIGeneratedSectionsSchema.safeParse({
      overview: 'Product overview text',
      problem_statement: 'Problem statement text',
      objectives: [
        { statement: 'Reduce churn', measurable_outcome: '10% → 5%', priority: 'must_have' },
      ],
      scope: { in_scope: ['Feature A'], out_of_scope: ['Feature B'] },
      user_stories: [
        { role: 'User', want: 'login', benefit: 'access', acceptance_criteria: ['Given...'] },
      ],
      success_metrics: [{ name: 'Retention', target: '90%', measurement_window: '30 days' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty/minimal input with defaults', () => {
    const result = AIGeneratedSectionsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.overview).toBe('');
      expect(result.data.objectives).toEqual([]);
      expect(result.data.user_stories).toEqual([]);
    }
  });

  it('rejects invalid objective priority', () => {
    const result = AIGeneratedSectionsSchema.safeParse({
      objectives: [{ statement: 'Goal', measurable_outcome: 'KR', priority: 'invalid_priority' }],
    });
    expect(result.success).toBe(false);
  });
});
