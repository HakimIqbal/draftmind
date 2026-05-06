export type InlineAction =
  | 'rewrite'
  | 'expand'
  | 'summarize'
  | 'shorter'
  | 'formal'
  | 'grammar'
  | 'translate'
  | 'add_examples'
  | 'make_actionable'
  | 'add_metrics'
  | 'simplify_jargon'
  | 'to_table'
  | 'to_list'
  | 'custom';

export interface InlineSuggestInput {
  action: InlineAction;
  selectedText: string;
  sectionKey: string;
  surroundingContext: string;
  customInstruction?: string;
}

const ACTION_INSTRUCTIONS: Record<string, string> = {
  rewrite:
    'Rewrite this text to be clearer, more direct, and professional. Write like a senior PM — no filler, no passive voice. Keep the same meaning but make every sentence earn its place.',
  expand:
    "Expand this text with concrete details: specific numbers, acceptance criteria, technical specifics, or real-world examples. Don't pad with filler — add substance.",
  summarize:
    'Condense this into the shortest version that retains ALL key information. Cut fluff, merge redundant points, keep specifics.',
  shorter:
    'Make this 40-60% shorter. Remove filler words, redundant phrases, and unnecessary qualifiers. Keep only what matters.',
  formal:
    'Rewrite in a polished, executive-ready tone. Suitable for board presentations or C-level stakeholders. Professional but not stiff.',
  grammar:
    'Fix grammar, spelling, punctuation, and awkward phrasing. Preserve the original meaning and tone exactly. Only fix errors.',
  translate:
    'Auto-detect the language of this text, then translate it. If the text is in Bahasa Indonesia, translate to English. If the text is in English, translate to Bahasa Indonesia. If mixed, translate all parts to the dominant target language. Preserve technical terms, product names, and acronyms as-is. The translation must read naturally — not like a machine translation.',
  add_examples:
    'Add 2-3 concrete, realistic examples that illustrate the point. Examples should be specific to the product/domain described in this PRD.',
  make_actionable:
    'Convert this into clear action items or acceptance criteria. Use "Given/When/Then" format for test cases, or imperative verbs for requirements.',
  add_metrics:
    'Add measurable targets, KPIs, or success criteria to this text. Use baseline → target format. If no data available, use "To be measured → [target]".',
  simplify_jargon:
    'Replace technical jargon and acronyms with plain language that non-technical stakeholders can understand. Keep accuracy.',
  to_table:
    'Convert this text into a well-structured markdown table. Choose appropriate column headers based on the content.',
  to_list:
    'Convert this paragraph or text into a clean bullet point list. Each bullet should be one clear point.',
};

export function buildInlineSuggestPrompt(input: InlineSuggestInput): string {
  const { action, selectedText, sectionKey, surroundingContext, customInstruction } = input;

  const instruction =
    action === 'custom' && customInstruction
      ? customInstruction
      : (ACTION_INSTRUCTIONS[action] ?? 'Improve this text.');

  return `You are editing a PRD section ("${sectionKey}"). The user selected specific text and wants you to: **${action}**.

## Instruction
${instruction}

## Selected text
${selectedText}

${surroundingContext ? `## Surrounding context (for reference — do NOT include in output)\n${surroundingContext}` : ''}

## Output Format
Return ONLY a valid JSON object — no markdown fences, no explanation:

{
  "suggestions": [
    {
      "text": "<replacement text>",
      "rationale": "<one sentence: what changed and why>"
    }
  ]
}

## Rules
- Provide exactly 3 variations, from most conservative to most creative.
- Each suggestion must be a direct drop-in replacement for the selected text.
- Match the language of the selected text (English, Bahasa Indonesia, or mixed).
- Write like a human PM, not AI. No filler phrases.
- For "to_table": output the table in markdown format within the "text" field.
- For "to_list": output bullet points with "- " prefix within the "text" field.
- Output valid JSON only.`;
}
