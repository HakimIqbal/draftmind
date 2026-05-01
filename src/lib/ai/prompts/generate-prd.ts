export interface GeneratePRDInput {
  brief: string;
  title: string;
  ownerName: string;
  stakeholderNames: string[];
  startDate?: string;
  endDate?: string;
  templateName?: string;
  locale?: 'en' | 'id' | 'mixed';
  targetUsers?: string;
  problemStatement?: string;
  teamMembers?: string;
  constraints?: string;
  successCriteria?: string;
  platform?: string;
  priority?: string;
  techStack?: string;
  designLink?: string;
}

export function buildGeneratePRDPrompt(input: GeneratePRDInput): string {
  const {
    brief,
    title,
    ownerName,
    stakeholderNames,
    startDate,
    endDate,
    templateName,
    locale = 'mixed',
    targetUsers,
    problemStatement,
    teamMembers,
    constraints,
    successCriteria,
    platform,
    priority,
    techStack,
    designLink,
  } = input;

  const localeInstruction =
    locale === 'en'
      ? 'Write all content in English.'
      : locale === 'id'
        ? 'Write all content in Bahasa Indonesia.'
        : 'Write content in a natural mix of English and Bahasa Indonesia, matching the language style of the brief.';

  const dateRange =
    startDate && endDate
      ? `The project timeline is from ${startDate} to ${endDate}. Use these dates to build realistic milestones with at least 4-5 phases.`
      : startDate
        ? `The project starts on ${startDate}. Estimate milestones from that date.`
        : 'No specific dates were provided. Use placeholder dates with [TO CONFIRM] markers.';

  const templateHint = templateName
    ? `The user selected the "${templateName}" template. Tailor tone and depth accordingly.`
    : '';

  const extraContext = [
    targetUsers && `Target Users/Audience: ${targetUsers}`,
    problemStatement && `Problem Statement: ${problemStatement}`,
    teamMembers && `Team Members: ${teamMembers}`,
    constraints && `Constraints & Limitations: ${constraints}`,
    successCriteria && `Success Criteria: ${successCriteria}`,
    platform && `Platform: ${platform}`,
    priority && `Priority Level: ${priority}`,
    techStack && `Tech Stack: ${techStack}`,
    designLink && `Design Reference: ${designLink}`,
  ]
    .filter(Boolean)
    .join('\n- ');

  return `You are a senior product manager writing a comprehensive, production-quality PRD. Generate a detailed PRD based on the brief below. Output ONLY a valid JSON object — no markdown fences, no explanation.

## Metadata
- Title: ${title}
- Owner: ${ownerName}
- Stakeholders: ${stakeholderNames.length > 0 ? stakeholderNames.join(', ') : '[TO CONFIRM]'}
- ${dateRange}
${templateHint}

## Additional Context
${extraContext ? `- ${extraContext}` : 'No additional context provided.'}

## Language
${localeInstruction}

## Brief
${brief}

## Quality Requirements — CRITICAL
You must write DETAILED, SPECIFIC content. Avoid generic filler text. Every section must demonstrate domain knowledge and thoughtful analysis.

### Overview (2-4 substantial paragraphs)
- Paragraph 1: What the product/feature is and the core value proposition
- Paragraph 2: Why it matters — market context, user pain, business opportunity
- Paragraph 3: How it works at a high level — key capabilities and approach
- Paragraph 4: Expected impact and success vision

### Problem Statement (2-3 paragraphs with evidence)
- Describe the SPECIFIC problem with concrete data points or user quotes
- Explain who is affected and how severely
- Quantify the business impact (lost revenue, user churn, inefficiency)

### Objectives (at least 4, with measurable key results)
- Each objective must have 2-3 specific, quantified key results
- Include both goals AND non-goals
- Key results must have baseline → target format where possible

### User Stories (at least 5, detailed)
- Each story must have 3-4 specific acceptance criteria
- Cover different user personas and scenarios
- Include edge cases and error scenarios
- Prioritize with must/should/could

### Functional Requirements (at least 6, detailed descriptions)
- Each requirement needs a multi-sentence description explaining the behavior
- Include specific details about UI behavior, data handling, edge cases
- Reference dependencies between requirements

### Non-Functional Requirements
- Performance: specific load times, concurrent users, response times
- Security: specific measures (encryption, auth, data protection)
- Accessibility: WCAG level, specific accommodations
- Scalability: growth projections, capacity planning

### Success Metrics (at least 4)
- Each metric needs a realistic baseline and target
- Include leading AND lagging indicators
- Specify measurement method and window

### Timeline (at least 4 milestones)
- Each milestone needs 2-3 specific deliverables
- Include design, development, testing, and launch phases
- Realistic dates based on the provided timeline

### Risks (at least 4)
- Each risk needs specific mitigation strategies (not generic "allocate more resources")
- Include technical, business, and operational risks
- Assign risk owners where team members are provided

${targetUsers ? `Use the target users "${targetUsers}" to create specific, empathetic user stories.` : ''}
${problemStatement ? `Ground the overview and problem statement in: "${problemStatement}"` : ''}
${constraints ? `Incorporate these constraints into scope, risks, and requirements: "${constraints}"` : ''}
${successCriteria ? `Use these success criteria to define measurable success metrics: "${successCriteria}"` : ''}
${platform ? `Design all requirements specifically for the "${platform}" platform.` : ''}
${techStack ? `Reference the tech stack "${techStack}" in technical requirements and architecture decisions.` : ''}
${teamMembers ? `Assign team members to DARCI roles and risk ownership: ${teamMembers}` : ''}

## Output JSON Schema

{
  "overview": "string — 2-4 detailed paragraphs as described above",
  "problem_statement": "string — 2-3 paragraphs with evidence and quantified impact",
  "objectives": [
    { "statement": "string — clear objective", "measurable_outcome": "string — specific KR with baseline/target", "priority": "must_have | should_have | nice_to_have" }
  ],
  "darci": {
    "decider": "string or null",
    "accountable": "string or null",
    "responsible": ["string"],
    "consulted": ["string"],
    "informed": ["string"]
  },
  "scope": {
    "in_scope": ["string — specific feature or capability"],
    "out_of_scope": ["string — explicitly excluded with reason"]
  },
  "user_stories": [
    { "role": "string", "want": "string — specific action", "benefit": "string — concrete outcome", "acceptance_criteria": ["string — testable criterion"] }
  ],
  "functional_reqs": [
    { "priority": "must_have | should_have | nice_to_have", "title": "string", "description": "string — 2-3 sentences with specific behavior details" }
  ],
  "nfr": {
    "performance": "string — specific metrics (e.g., page load < 2s, API response < 500ms)",
    "security": "string — specific measures (e.g., AES-256 encryption, OAuth 2.0, RBAC)",
    "accessibility": "string — specific standards (e.g., WCAG 2.1 AA, screen reader support)",
    "scalability": "string — specific targets (e.g., support 10K concurrent users, 99.9% uptime)"
  },
  "success_metrics": [
    { "name": "string", "baseline": "string — current value", "target": "string — goal value", "measurement_window": "string" }
  ],
  "timeline": [
    { "title": "string — milestone name", "date": "string — YYYY-MM-DD", "deliverable": "string — specific deliverables" }
  ],
  "risks": [
    { "description": "string — specific risk", "likelihood": "low | medium | high", "impact": "low | medium | high", "mitigation": "string — concrete mitigation steps" }
  ],
  "references": [
    { "type": "string", "url": "string", "title": "string" }
  ],
  "glossary": [
    { "term": "string", "definition": "string — clear, non-circular definition" }
  ],
  "changelog": [
    { "version": 1, "date": "${startDate ?? new Date().toISOString().slice(0, 10)}", "author": "${ownerName}", "summary": "Initial draft generated by DraftMind AI" }
  ]
}

Rules:
- Generate at least 4 objectives (with 2+ key results each), 5 user stories (with 3+ ACs each), 6 functional requirements (with detailed descriptions), 4 success metrics, 4 timeline milestones, and 4 risks.
- Use the owner name "${ownerName}" for the accountable role in DARCI.
- Populate stakeholder names in DARCI roles: ${stakeholderNames.join(', ') || '[TO CONFIRM]'}.
- NEVER write generic filler like "improve user experience" or "enhance performance". Be SPECIFIC.
- Every metric must have realistic numbers, not placeholders.
- Output valid JSON only.`;
}
