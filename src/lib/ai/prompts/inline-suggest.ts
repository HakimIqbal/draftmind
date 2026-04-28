export type InlineAction = 'rewrite' | 'expand' | 'summarize' | 'shorter' | 'formal' | 'grammar';

export interface InlineSuggestInput {
  action: InlineAction;
  selectedText: string;
  sectionKey: string;
  surroundingContext: string;
}

const ACTION_INSTRUCTIONS: Record<InlineAction, string> = {
  rewrite:
    'Rewrite the selected text to improve clarity and readability while preserving the original meaning.',
  expand:
    'Expand the selected text with more detail, examples, or specificity. Add concrete numbers or acceptance criteria where appropriate.',
  summarize:
    'Summarize the selected text into a shorter, more concise version that retains all key information.',
  shorter:
    'Make the selected text shorter by removing filler words and redundancy. Keep only essential information.',
  formal:
    'Rewrite the selected text in a more formal, professional tone suitable for executive stakeholders.',
  grammar:
    'Fix any grammar, spelling, punctuation, or awkward phrasing issues in the selected text. Preserve the original meaning and tone.',
};

export function buildInlineSuggestPrompt(input: InlineSuggestInput): string {
  const { action, selectedText, sectionKey, surroundingContext } = input;

  return `You are editing a PRD section ("${sectionKey}"). The user selected specific text and requested: **${action}**.

## Instruction
${ACTION_INSTRUCTIONS[action]}

## Selected text
${selectedText}

## Surrounding context (for reference only — do NOT modify this)
${surroundingContext}

## Output Format
Return ONLY a valid JSON object — no markdown fences, no explanation:

{
  "suggestions": [
    {
      "text": "<replacement text — must be a direct drop-in replacement for the selected text>",
      "rationale": "<one sentence explaining what changed and why>"
    }
  ]
}

## Rules
- Provide exactly 3 variations, ordered from most conservative to most creative.
- Each suggestion must be a drop-in replacement for the selected text. Do not include surrounding context in the replacement.
- Keep the same language (English, Bahasa Indonesia, or mixed) as the selected text.
- Output valid JSON only.`;
}
