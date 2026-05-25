export interface GeneratePRDInput {
  brief: string;
  title: string;
  ownerName: string;
  stakeholderNames: string[];
  startDate?: string;
  endDate?: string;
  templateName?: string;
  templateSections?: { name: string; guidelines: string }[];
  templateInstructions?: string;
  generationMode?: 'standard' | 'template';
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

function detectBriefLanguage(brief: string): 'en' | 'id' {
  const idWords = [
    'dan',
    'yang',
    'untuk',
    'dengan',
    'dari',
    'ini',
    'itu',
    'adalah',
    'pada',
    'ke',
    'di',
    'akan',
    'telah',
    'sudah',
    'bisa',
    'dapat',
    'tidak',
    'juga',
    'atau',
    'harus',
    'oleh',
    'saya',
    'kami',
    'mereka',
    'agar',
    'supaya',
    'sehingga',
    'karena',
    'seperti',
    'lebih',
    'sangat',
    'aplikasi',
    'pengguna',
    'fitur',
    'sistem',
    'membuat',
    'menggunakan',
  ];
  const words = brief.toLowerCase().split(/\s+/);
  const idCount = words.filter((w) => idWords.includes(w)).length;
  const ratio = idCount / words.length;
  return ratio > 0.1 ? 'id' : 'en';
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
    templateSections,
    templateInstructions,
    generationMode = templateSections && templateSections.length > 0 ? 'template' : 'standard',
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

  const effectiveLocale = locale === 'mixed' ? detectBriefLanguage(brief) : locale;

  const localeInstruction =
    effectiveLocale === 'id'
      ? 'Write ALL content in Bahasa Indonesia.'
      : 'Write ALL content in English.';

  const dateRange =
    startDate && endDate
      ? `Timeline: ${startDate} to ${endDate}.`
      : startDate
        ? `Start: ${startDate}.`
        : 'Dates: [TO CONFIRM].';

  // Collect all known people
  const knownPeople = [ownerName];
  if (stakeholderNames.length > 0) knownPeople.push(...stakeholderNames);
  if (teamMembers) {
    teamMembers
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((name) => knownPeople.push(name));
  }
  const uniquePeople = [...new Set(knownPeople)];

  const contextLines = [
    `Product Name: ${title}`,
    `Document Owner: ${ownerName}`,
    `Developers: ${teamMembers || '[TO CONFIRM]'}`,
    `Stakeholders: ${stakeholderNames.length > 0 ? stakeholderNames.join(', ') : '[TO CONFIRM]'}`,
    dateRange,
    templateName && `Template: ${templateName}`,
    targetUsers && `Target Users: ${targetUsers}`,
    problemStatement && `Problem Statement: ${problemStatement}`,
    constraints && `Constraints: ${constraints}`,
    successCriteria && `Success Criteria: ${successCriteria}`,
    platform && `Platform: ${platform}`,
    priority && `Priority: ${priority}`,
    techStack && `Tech Stack: ${techStack}`,
    designLink && `Design Reference: ${designLink}`,
  ]
    .filter(Boolean)
    .join('\n');

  if (generationMode === 'template' && templateSections && templateSections.length > 0) {
    const sectionContract = templateSections
      .map(
        (s, i) =>
          `${i + 1}. ${s.name}${s.guidelines ? ` — Guidelines: ${s.guidelines}` : ' — Guidelines: use the section name and user input as the rubric.'}`,
      )
      .join('\n');

    return `Write a PRD using the selected template exactly. The output must match the template section contract and must not use DraftMind's standard 14-section PRD format.

## Input
${contextLines}

## Brief
${brief}

## Language
${localeInstruction}

## Template
Template Name: ${templateName || 'Selected template'}
${templateInstructions ? `Global Template Instructions: ${templateInstructions}` : ''}

## Exact Section Contract
${sectionContract}

## Rules
KNOWN PEOPLE (with their professional roles): ${uniquePeople.join(', ')}
These are the ONLY names you may use. Do not invent names, stakeholders, developers, statistics, links, dates, or metrics.

1. Generate EXACTLY ${templateSections.length} sections.
2. Use the exact section titles above.
3. Preserve the exact order above.
4. Do NOT add sections.
5. Do NOT remove sections.
6. Do NOT rename sections.
7. Use each section's guidelines as instructions for its content.
8. Use the global template instructions if provided.
9. Use the user form input as context for every section.
10. If information is missing, write [TO CONFIRM] instead of fabricating details.
11. Keep content practical, specific, and directly useful for the product team.

IMPORTANT OUTPUT FORMAT: Return ONLY JSON with this shape:
{
  "sections": [
    { "title": "${templateSections[0]?.name ?? 'Section'}", "content": "Generated content..." }
  ]
}`;
  }

  return `Write a complete PRD as if you're a senior product manager drafting this for your team. Make it read naturally — like a real person wrote it, not a template filler. All 14 sections must have real, useful content.

## Input
${contextLines}

## Brief
${brief}

## Language
${localeInstruction}

## Content Rules

KNOWN PEOPLE (with their professional roles): ${uniquePeople.join(', ')}
These are the ONLY names you may use. Use their professional roles (shown in parentheses) to assign DARCI roles and Timeline PIC appropriately. For example, assign Software Engineers to Responsible/development tasks, Product Managers to Decider/planning tasks. For roles without enough people, use team names: "Engineering Team", "QA Team", "Design Team".

1. NEVER FABRICATE: Don't invent names, statistics, or research. Mark unknowns as [TO CONFIRM] or "To be measured".
2. OVERVIEW: 4-6 sentences. What is this product? What problem does it solve? Who benefits? Write it like an elevator pitch to your CEO.
3. PROBLEM STATEMENT: 2 paragraphs. First: describe the pain point vividly — make the reader feel it. Second: what happens if we don't solve this? Real consequences.
4. OBJECTIVES: 4-6 clear goals. Each with a measurable key result (baseline → target). No vague goals like "improve user experience".
5. NO REPETITION: Every section must add NEW information. If you said it in Overview, don't repeat it in Problem Statement.
6. DARCI: Assign real people from the input based on their professional roles. Document Owner = Decider. Engineers = Responsible. Managers = Accountable. Write guidelines that are specific to THIS project, not generic job descriptions.
7. USER STORIES: Write from real user perspective. "As a driver stuck in traffic, I want to see which parking lot has empty spots right now, so I don't waste 20 minutes circling the block." Include 2-4 testable acceptance criteria.
8. FUNCTIONAL REQS: Describe actual behavior. Not "the system shall support search" but "Users type a location → map centers on that area → available spots within 500m radius appear as green pins within 2 seconds."
9. SUCCESS METRICS: 6-8 metrics. Use numbers from the brief when available. For unknowns, use "To be measured" as baseline. Every metric needs a realistic target and measurement window.
10. TIMELINE: Use the provided date range. Each phase needs: what gets built, who's responsible (by name/role), and what's delivered at the end.
11. RISKS: Project-specific risks only. Not generic "scope creep" — but "IoT sensor vendor may delay delivery of 500 units needed for 5 pilot buildings, pushing Phase 2 by 3 weeks."
12. REFERENCES: 2-4 relevant industry standards, competitor analyses, or technical docs that the team should read.
13. GLOSSARY: 5-10 terms that team members from different backgrounds might not know. Define them simply.
14. CHANGELOG: One entry only — v1, "${ownerName}", "Initial draft".

CRITICAL: Generate ALL 14 sections. Do NOT skip any. output must include: overview, problem_statement, objectives, darci, scope, user_stories, functional_reqs, nfr, success_metrics, timeline, risks, references, glossary, changelog.${
    templateSections && templateSections.length > 0
      ? `

## Template Instructions
This PRD uses the "${templateName}" template. FOCUS on generating content for these specific sections. Sections not listed here should be left empty or minimal:
${templateSections.map((s, i) => `${i + 1}. **${s.name}**: ${s.guidelines}`).join('\n')}`
      : ''
  }`;
}
