import type { PRDDocument, PRDRichText } from './schema';

export interface HealthBreakdown {
  completeness: number; // 0-100: % of required sections that have content
  specificity: number; // 0-100: density of metrics/numbers/dates
  structural: number; // 0-100: proper hierarchy, linked references
  consistency: number; // 0-100: heuristic for contradictions
}

export interface HealthResult {
  score: number;
  breakdown: HealthBreakdown;
}

// --- Helpers ---

function richTextHasContent(rt: PRDRichText): boolean {
  return rt.content.content.length > 0 && rt.word_count > 0;
}

function extractPlainText(rt: PRDRichText): string {
  return extractTextFromNodes(rt.content.content);
}

function extractTextFromNodes(nodes: Record<string, unknown>[]): string {
  const parts: string[] = [];
  for (const node of nodes) {
    if (typeof node.text === 'string') {
      parts.push(node.text);
    }
    if (Array.isArray(node.content)) {
      parts.push(extractTextFromNodes(node.content as Record<string, unknown>[]));
    }
  }
  return parts.join(' ');
}

function collectAllText(prd: PRDDocument): string {
  const texts: string[] = [];
  texts.push(extractPlainText(prd.sections.overview));
  texts.push(extractPlainText(prd.sections.problem_statement));

  for (const obj of prd.sections.objectives) {
    texts.push(obj.description);
    texts.push(...obj.key_results);
  }

  for (const story of prd.sections.user_stories) {
    texts.push(story.role, story.want, story.benefit);
    texts.push(...story.acceptance_criteria);
  }

  for (const req of prd.sections.functional_reqs) {
    texts.push(req.title, req.description);
  }

  const nfr = prd.sections.nfr;
  texts.push(
    ...nfr.performance,
    ...nfr.security,
    ...nfr.accessibility,
    ...nfr.scalability,
    ...nfr.reliability,
    ...nfr.compliance,
  );

  for (const metric of prd.sections.success_metrics) {
    texts.push(metric.name, metric.baseline, metric.target, metric.measurement_window);
  }

  for (const milestone of prd.sections.timeline) {
    texts.push(milestone.title);
    texts.push(...milestone.deliverables);
  }

  for (const risk of prd.sections.risks) {
    texts.push(risk.description, risk.mitigation);
  }

  for (const ref of prd.sections.references) {
    texts.push(ref.title);
    if (ref.description) texts.push(ref.description);
  }

  for (const entry of prd.sections.glossary) {
    texts.push(entry.term, entry.definition);
  }

  for (const entry of prd.sections.changelog) {
    texts.push(entry.summary);
  }

  return texts.filter(Boolean).join(' ');
}

function darciHasPeople(darci: PRDDocument['sections']['darci']): boolean {
  for (const role of [
    darci.decider,
    darci.accountable,
    darci.responsible,
    darci.consulted,
    darci.informed,
  ]) {
    const people = Array.isArray(role) ? role : (role?.people ?? []);
    if (people.length > 0) return true;
  }
  return false;
}

// --- Dimension calculators ---

function computeCompleteness(prd: PRDDocument): number {
  const checks: boolean[] = [
    richTextHasContent(prd.sections.overview),
    richTextHasContent(prd.sections.problem_statement),
    prd.sections.objectives.length > 0,
    darciHasPeople(prd.sections.darci),
    prd.sections.scope.in_scope.length > 0,
    prd.sections.user_stories.length > 0,
    prd.sections.functional_reqs.length > 0,
    Object.values(prd.sections.nfr).some((arr) => arr.length > 0),
    prd.sections.success_metrics.length > 0,
    prd.sections.timeline.length > 0,
    prd.sections.risks.length > 0,
    prd.sections.references.length > 0,
    prd.sections.glossary.length > 0,
    prd.sections.changelog.length > 0,
  ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

function computeSpecificity(prd: PRDDocument): number {
  const allText = collectAllText(prd);
  if (allText.trim().length === 0) return 0;

  const words = allText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (wordCount === 0) return 0;

  // Count numbers (e.g., "100", "3.5", "50%")
  const numberMatches = allText.match(/\b\d+(\.\d+)?%?\b/g) || [];
  // Count date-like patterns (ISO dates, "Q1 2026", "Jan 2026", etc.)
  const dateMatches =
    allText.match(
      /\b\d{4}-\d{2}(-\d{2})?\b|\bQ[1-4]\s+\d{4}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/gi,
    ) || [];
  // Count metric names from success_metrics
  const metricCount = prd.sections.success_metrics.length;

  const specificTokens = numberMatches.length + dateMatches.length + metricCount;
  const density = specificTokens / wordCount;

  // Scale: density 0.05 => 50, density >= 0.10 => 100
  const score = Math.min(100, Math.round(density * 1000));
  return score;
}

function computeStructural(prd: PRDDocument): number {
  let totalChecks = 0;
  let passed = 0;

  // User stories should have acceptance criteria
  for (const story of prd.sections.user_stories) {
    totalChecks++;
    if (story.acceptance_criteria.length > 0) passed++;
  }

  // Requirements should have description filled
  for (const req of prd.sections.functional_reqs) {
    totalChecks++;
    if (req.description.trim().length > 0) passed++;
  }

  // Risks should have mitigation
  for (const risk of prd.sections.risks) {
    totalChecks++;
    if (risk.mitigation.trim().length > 0) passed++;
  }

  // Milestones should have deliverables
  for (const milestone of prd.sections.timeline) {
    totalChecks++;
    if (milestone.deliverables.length > 0) passed++;
  }

  // Metrics should have target and baseline
  for (const metric of prd.sections.success_metrics) {
    totalChecks++;
    if (metric.target.trim().length > 0 && metric.baseline.trim().length > 0) passed++;
  }

  // Objectives should have key_results
  for (const obj of prd.sections.objectives) {
    totalChecks++;
    if (obj.key_results.length > 0) passed++;
  }

  if (totalChecks === 0) return 0;
  return Math.round((passed / totalChecks) * 100);
}

function computeConsistency(prd: PRDDocument): number {
  const allText = collectAllText(prd);
  if (allText.trim().length === 0) return 100; // empty = no inconsistencies

  const tbdPattern = /\[(?:TBD|TO CONFIRM|TODO|PLACEHOLDER|TBC|FIXME)\]/gi;
  const matches = allText.match(tbdPattern) || [];
  const markerCount = matches.length;

  // Each marker deducts 10 points, min 0
  return Math.max(0, 100 - markerCount * 10);
}

// --- Main export ---

export function computeHealthScore(prd: PRDDocument): HealthResult {
  const breakdown: HealthBreakdown = {
    completeness: computeCompleteness(prd),
    specificity: computeSpecificity(prd),
    structural: computeStructural(prd),
    consistency: computeConsistency(prd),
  };

  // Weighted average: completeness 40%, specificity 20%, structural 25%, consistency 15%
  const score = Math.round(
    breakdown.completeness * 0.4 +
      breakdown.specificity * 0.2 +
      breakdown.structural * 0.25 +
      breakdown.consistency * 0.15,
  );

  return { score, breakdown };
}
