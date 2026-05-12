export function buildAIReviewPrompt(prdJson: string): string {
  return `You are a senior product reviewer. Analyze the following PRD and produce a quality review.

## PRD Content
${prdJson}

## Review Criteria

Score the PRD on four dimensions (0-100 each). Focus on the QUALITY of content that IS present — do not penalize for missing sections if the PRD's own scope does not require them:

1. **Completeness** — Are the sections that ARE present fully developed? Are there [TO CONFIRM] markers, empty arrays, or placeholder content that need attention? A PRD with 5 well-written sections should score higher than one with 14 empty or skeletal sections.
2. **Specificity** — Do objectives have measurable outcomes? Do success metrics have concrete targets and baselines? Are timelines realistic with actual dates?
3. **Structural** — Do user stories follow "As a [role], I want [action], so that [benefit]" format? Do they have acceptance criteria? Are functional requirements prioritized?
4. **Consistency** — Are stakeholder names consistent across sections? Do scope items align with functional requirements? Do risks relate to the stated objectives?

## Scoring Principles
- Evaluate against the PRD's OWN defined scope and goals, not a fixed template standard.
- A focused, well-written PRD with fewer sections can score 80+ if the content is high quality and internally consistent.
- Only flag missing sections as a finding if they are clearly necessary for the product context described.
- [TO CONFIRM] markers or empty placeholder content are always high-severity findings regardless of section count.
- Reward clarity, specificity, and actionability over mere volume.

## Output Format

Output ONLY a valid JSON object with this exact shape — no markdown fences, no commentary:

{
  "health_score": <number 0-100, weighted average: completeness 30%, specificity 30%, structural 20%, consistency 20%>,
  "breakdown": {
    "completeness": <number 0-100>,
    "specificity": <number 0-100>,
    "structural": <number 0-100>,
    "consistency": <number 0-100>
  },
  "summary": "<2-3 sentence overall assessment>",
  "findings": [
    {
      "severity": "high | medium | low",
      "section_key": "<MUST be one of these exact values: overview, problem_statement, objectives, darci, scope, user_stories, functional_reqs, nfr, success_metrics, timeline, risks, references, glossary, changelog>",
      "title": "<short finding title>",
      "description": "<what the issue is>",
      "suggested_fix": "<actionable suggestion that can be applied to improve the specific section>"
    }
  ]
}

## Rules
- List findings in order of severity (high first).
- Include at least one finding per dimension that scored below 80.
- Mark any [TO CONFIRM] placeholder as a high-severity finding.
- Be constructive — every finding should include a suggested_fix when possible.
- The section_key MUST be one of the 14 valid PRD section keys listed above. Do NOT use dimension names (completeness, specificity, structural, consistency) as section_key.
- Do NOT add findings for sections that are simply absent — only flag actual content quality issues in the sections that are present.
- Output valid JSON only.`;
}
