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
      ? `The project timeline is from ${startDate} to ${endDate}. Use these dates to build realistic milestones.`
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

  return `Generate a complete PRD based on the following brief. Output ONLY a valid JSON object — no markdown fences, no explanation, no text outside the JSON.

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

## Instructions
Generate all 14 PRD sections. For any section where the brief does not provide enough information, fill in reasonable defaults and mark uncertain values with [TO CONFIRM].

${targetUsers ? `Use the target users "${targetUsers}" to shape user stories and requirements.` : ''}
${problemStatement ? `Use the problem statement to drive the overview and objectives.` : ''}
${constraints ? `Incorporate the constraints into scope and risks sections.` : ''}
${successCriteria ? `Use the success criteria to define success metrics.` : ''}
${platform ? `Design requirements for the "${platform}" platform.` : ''}
${techStack ? `Reference the tech stack "${techStack}" in technical requirements and non-functional requirements.` : ''}
${teamMembers ? `Assign team members to DARCI roles: ${teamMembers}` : ''}

The JSON object must have exactly these keys:

{
  "overview": "string — 2-4 paragraph executive summary",
  "problem_statement": "string — clear description of the problem being solved",
  "objectives": [
    { "statement": "string", "measurable_outcome": "string", "priority": "must_have | should_have | nice_to_have" }
  ],
  "darci": {
    "decider": "string or null",
    "accountable": "string or null",
    "responsible": ["string"],
    "consulted": ["string"],
    "informed": ["string"]
  },
  "scope": {
    "in_scope": ["string — feature or capability included"],
    "out_of_scope": ["string — explicitly excluded item"]
  },
  "user_stories": [
    { "role": "string", "want": "string", "benefit": "string", "acceptance_criteria": ["string"] }
  ],
  "functional_reqs": [
    { "priority": "must_have | should_have | nice_to_have", "title": "string", "description": "string" }
  ],
  "nfr": {
    "performance": "string or null",
    "security": "string or null",
    "accessibility": "string or null",
    "scalability": "string or null"
  },
  "success_metrics": [
    { "name": "string", "baseline": "string or null", "target": "string", "measurement_window": "string" }
  ],
  "timeline": [
    { "title": "string — milestone name", "date": "string — YYYY-MM-DD", "deliverable": "string" }
  ],
  "risks": [
    { "description": "string", "likelihood": "low | medium | high", "impact": "low | medium | high", "mitigation": "string" }
  ],
  "references": [
    { "type": "string", "url": "string", "title": "string" }
  ],
  "glossary": [
    { "term": "string", "definition": "string" }
  ],
  "changelog": [
    { "version": 1, "date": "${startDate ?? new Date().toISOString().slice(0, 10)}", "author": "${ownerName}", "summary": "Initial draft generated by DraftMind AI" }
  ]
}

Rules:
- Generate at least 3 objectives, 4 user stories, 5 functional requirements, 3 success metrics, 3 timeline milestones, and 3 risks.
- Use the owner name "${ownerName}" for the accountable role in DARCI unless the brief specifies otherwise.
- Populate stakeholder names in DARCI roles where appropriate: ${stakeholderNames.join(', ') || '[TO CONFIRM]'}.
- Each user story must have at least 2 acceptance criteria.
- Output valid JSON only.`;
}
