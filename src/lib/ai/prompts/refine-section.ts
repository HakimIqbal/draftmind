export interface RefineSectionInput {
  sectionKey: string;
  sectionLabel: string;
  currentContent: unknown;
  instruction: string;
  prdTitle: string;
}

export function buildRefineSectionPrompt(input: RefineSectionInput): string {
  const { sectionKey, sectionLabel, currentContent, instruction, prdTitle } = input;

  const serialized =
    typeof currentContent === 'string' ? currentContent : JSON.stringify(currentContent, null, 2);

  return `You are refining the "${sectionLabel}" section of the PRD titled "${prdTitle}".

## Current content (section key: "${sectionKey}")
${serialized}

## User instruction
${instruction}

## Rules
1. Output ONLY the new content for this section — no wrapper object, no extra keys.
2. The output must be valid JSON that can replace the current value of "${sectionKey}" directly.
3. Preserve the same JSON shape/schema as the current content. If the current value is a string, return a string. If it is an array of objects, return an array of objects with the same keys.
4. Apply the user's instruction precisely. Do not change parts of the content that the instruction does not address.
5. If the instruction asks for something you cannot determine, use [TO CONFIRM] markers.
6. Do not wrap the output in markdown code fences. Return raw JSON only.`;
}
