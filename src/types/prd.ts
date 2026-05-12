export type {
  PRDDocument,
  PRDRichText,
  PRDObjective,
  PRDDarciMatrix,
  PRDScope,
  PRDUserStory,
  PRDRequirement,
  PRDNFR,
  PRDMetric,
  PRDMilestone,
  PRDRisk,
  PRDReference,
  PRDGlossaryEntry,
  PRDChangelogEntry,
  TiptapContent,
} from '@/lib/prd/schema';

export { createEmptyPRD } from '@/lib/prd/schema';

export type { HealthBreakdown, HealthResult } from '@/lib/prd/health-score';
export type { ReadabilityResult, ReadabilityGrade } from '@/lib/prd/readability';

import type { PRDDocument } from '@/lib/prd/schema';

export type PRDSectionKey = keyof PRDDocument['sections'];

export const PRD_SECTION_KEYS = [
  'overview',
  'problem_statement',
  'objectives',
  'darci',
  'scope',
  'user_stories',
  'functional_reqs',
  'nfr',
  'success_metrics',
  'timeline',
  'risks',
  'references',
  'glossary',
  'changelog',
] as const;

export const PRD_SECTION_LABELS: Record<PRDSectionKey, string> = {
  overview: 'Overview',
  problem_statement: 'Problem Statement',
  objectives: 'Objectives',
  darci: 'DARCI Matrix',
  scope: 'Scope',
  user_stories: 'User Stories',
  functional_reqs: 'Functional Requirements',
  nfr: 'Non-Functional Requirements',
  success_metrics: 'Success Metrics',
  timeline: 'Timeline',
  risks: 'Risks',
  references: 'References',
  glossary: 'Glossary',
  changelog: 'Changelog',
};

export const PRD_SECTION_DESCRIPTIONS: Record<PRDSectionKey, string> = {
  overview: 'High-level summary of the product or feature',
  problem_statement: 'The problem this PRD aims to solve',
  objectives: 'Goals and non-goals with measurable key results',
  darci: 'Decision-maker, Accountable, Responsible, Consulted, Informed',
  scope: 'What is in-scope and out-of-scope',
  user_stories: 'User stories with acceptance criteria',
  functional_reqs: 'Detailed functional requirements',
  nfr: 'Performance, security, accessibility, and other non-functional requirements',
  success_metrics: 'KPIs with baseline, target, and measurement window',
  timeline: 'Milestones with dates and deliverables',
  risks: 'Identified risks with likelihood, impact, and mitigation',
  references: 'Related documents, links, and resources',
  glossary: 'Definitions of domain-specific terms',
  changelog: 'Version history of this PRD',
};
