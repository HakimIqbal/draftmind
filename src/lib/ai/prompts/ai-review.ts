export function buildAIReviewPrompt(prdJson: string): string {
  return `You are a senior product reviewer. Analyze the following PRD and produce a quality review.

## PRD Content
${prdJson}

## Review Criteria

Score the PRD on four dimensions (0-100 each):

1. **Completeness** — Are all 14 sections filled? Are there [TO CONFIRM] markers or empty arrays that need attention?
2. **Specificity** — Do objectives have measurable outcomes? Do success metrics have concrete targets and baselines? Are timelines realistic with actual dates?
3. **Structural** — Do user stories follow "As a [role], I want [action], so that [benefit]" format? Do they have acceptance criteria? Are functional requirements prioritized?
4. **Consistency** — Are stakeholder names consistent across DARCI and other sections? Do scope items align with functional requirements? Do risks relate to the stated objectives?

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
      "section_key": "<which section this finding relates to>",
      "title": "<short finding title>",
      "description": "<what the issue is>",
      "suggested_fix": "<optional actionable suggestion>"
    }
  ]
}

## Rules
- List findings in order of severity (high first).
- Include at least one finding per dimension that scored below 80.
- Mark any [TO CONFIRM] placeholder as a high-severity finding.
- Be constructive — every finding should include a suggested_fix when possible.
- Output valid JSON only.`;
}
