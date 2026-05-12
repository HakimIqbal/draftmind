export interface RefineSectionInput {
  sectionKey: string;
  sectionLabel: string;
  currentContent: unknown;
  instruction: string;
  prdTitle: string;
}

/**
 * Exact JSON schemas per section key. AI must return data matching these
 * field names precisely — no synonyms, no extra keys.
 */
const SECTION_SCHEMAS: Record<string, string> = {
  overview: `PRDRichText object:
{ "content": { "type": "doc", "content": [ { "type": "paragraph", "content": [{ "type": "text", "text": "..." }] } ] }, "word_count": <number> }`,

  problem_statement: `PRDRichText object (same shape as overview):
{ "content": { "type": "doc", "content": [ { "type": "paragraph", "content": [{ "type": "text", "text": "..." }] } ] }, "word_count": <number> }`,

  objectives: `Array of objective objects:
[{ "id": "OBJ-001", "type": "goal" | "non-goal", "description": "...", "key_results": ["KR1", "KR2"] }]`,

  darci: `DARCI matrix object:
{ "decider": { "people": ["Name"], "guidelines": "..." }, "accountable": { "people": [...], "guidelines": "..." }, "responsible": { "people": [...], "guidelines": "..." }, "consulted": { "people": [...], "guidelines": "..." }, "informed": { "people": [...], "guidelines": "..." } }`,

  scope: `Scope object:
{ "in_scope": ["item1", "item2"], "out_of_scope": ["item1", "item2"] }`,

  user_stories: `Array of user story objects. CRITICAL field names — use "want" NOT "action":
[{ "id": "US-001", "role": "...", "want": "...", "benefit": "...", "acceptance_criteria": ["AC1", "AC2"], "priority": "must" | "should" | "could" | "wont" }]`,

  functional_reqs: `Array of requirement objects:
[{ "id": "FR-001", "priority": "must" | "should" | "could" | "wont", "title": "...", "description": "...", "dependencies": [] }]`,

  nfr: `NFR object with exactly these 6 category keys:
{ "performance": ["req1"], "security": ["req1"], "accessibility": ["req1"], "scalability": ["req1"], "reliability": ["req1"], "compliance": ["req1"] }`,

  success_metrics: `Array of metric objects:
[{ "id": "SM-001", "name": "...", "definition": "...", "baseline": "...", "target": "...", "measurement_window": "..." }]`,

  timeline: `Array of milestone objects:
[{ "id": "MS-001", "title": "...", "date": "YYYY-MM-DD", "activity": "...", "deliverables": ["d1", "d2"], "pic": "...", "status": "planned" | "in_progress" | "completed" | "delayed" }]`,

  risks: `Array of risk objects:
[{ "id": "RISK-001", "description": "...", "likelihood": "low" | "medium" | "high", "impact": "low" | "medium" | "high", "mitigation": "..." }]`,

  references: `Array of reference objects:
[{ "id": "REF-001", "type": "document" | "url" | "figma" | "jira" | "slack" | "other", "url": "...", "title": "..." }]`,

  glossary: `Array of glossary objects:
[{ "term": "...", "definition": "..." }]`,

  changelog: `Array of changelog objects:
[{ "version": <number>, "date": "YYYY-MM-DD", "author": "...", "summary": "..." }]`,
};

export function buildRefineSectionPrompt(input: RefineSectionInput): string {
  const { sectionKey, sectionLabel, currentContent, instruction, prdTitle } = input;

  const serialized =
    typeof currentContent === 'string' ? currentContent : JSON.stringify(currentContent, null, 2);

  const schema = SECTION_SCHEMAS[sectionKey] ?? '';
  const schemaBlock = schema
    ? `\n## REQUIRED output schema for "${sectionKey}"\n${schema}\n\nYou MUST use these exact field names. Do NOT rename fields (e.g. use "want" not "action", use "acceptance_criteria" not "criteria").\n`
    : '';

  return `You are refining the "${sectionLabel}" section of the PRD titled "${prdTitle}".

## Current content (section key: "${sectionKey}")
${serialized}
${schemaBlock}
## User instruction
${instruction}

## Rules
1. Output ONLY the new content for this section — no wrapper object, no extra keys.
2. The output must be valid JSON that can replace the current value of "${sectionKey}" directly.
3. Preserve the EXACT same JSON schema as shown above. Use the EXACT field names listed — no synonyms, no renaming.
4. If the current content is an array of objects, return an array of objects with the SAME keys. Do not add or remove keys.
5. Apply the user's instruction precisely. Do not change parts of the content that the instruction does not address.
6. If the instruction asks for something you cannot determine, use [TO CONFIRM] markers.
7. Do not wrap the output in markdown code fences. Return raw JSON only.`;
}
