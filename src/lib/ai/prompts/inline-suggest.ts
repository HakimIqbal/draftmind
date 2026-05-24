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
  | 'to_list';

export interface InlineSuggestInput {
  action: InlineAction;
  selectedText: string;
  sectionKey: string;
  surroundingContext: string;
}

const ACTION_INSTRUCTIONS: Record<string, string> = {
  rewrite: `Rewrite this text to be clearer and more direct.

STRICT RULES:
- Output must have the EXACT SAME number of paragraphs as the original.
- Do NOT add new information that was not in the original.
- Do NOT remove any information from the original.
- Only improve clarity: remove filler words, fix passive voice, make sentences sharper.
- Preserve all technical terms, product names, and acronyms.`,

  expand: `Expand this text by adding 2-3 new paragraphs with concrete details and context.

STRICT RULES:
- Add exactly 2-3 NEW paragraphs after the original text.
- New paragraphs must contain: specific examples, deeper explanation, or supporting data.
- Total output must be 1.5x to 2x the length of the original text.
- Do NOT rewrite the original text - keep it as-is and ADD new paragraphs below it.
- No filler or generic statements. Every added sentence must provide real value.`,

  summarize: `Condense this text into key bullet points.

STRICT RULES:
- Output must be a bullet list with MAXIMUM 5 bullet points.
- Each bullet must be exactly 1 sentence.
- Do NOT exceed 5 bullets under any circumstance.
- Retain all critical information: numbers, names, dates, decisions.
- Cut all filler, examples, and repetition.`,

  shorter: `Make this text 40-60% shorter.

STRICT RULES:
- Count the words in the original text. Output must have 40-60% FEWER words.
- Example: 100 words original -> output must be 40-60 words.
- Preserve ALL key information: numbers, requirements, decisions, names.
- Cut: filler words, redundant phrases, unnecessary qualifiers, repeated points.
- Do NOT change the meaning or remove critical details.`,

  formal: `Rewrite in a professional, executive-ready tone.

STRICT RULES:
- Structure and paragraph count must be EXACTLY THE SAME as the original.
- Word count must be within 10% of the original (not significantly longer or shorter).
- Only change tone and word choice: casual -> formal, slang -> professional.
- Do NOT add new information or remove existing information.
- Do NOT change the meaning. Only change how it sounds.`,

  grammar: `Fix grammar, spelling, and punctuation errors ONLY.

STRICT RULES:
- ONLY fix: typos, grammar mistakes, spelling errors, punctuation issues, awkward phrasing.
- Do NOT change word choice, tone, style, or structure.
- Do NOT rewrite sentences that are grammatically correct.
- Do NOT add or remove any information.
- Output must be nearly identical to the original - only errors should change.
- If there are no errors, return the text unchanged.`,

  translate: `Translate this text between Bahasa Indonesia and English.

STRICT RULES:
- Auto-detect the language of the input text.
- If input is Bahasa Indonesia -> translate to English.
- If input is English -> translate to Bahasa Indonesia.
- If mixed languages -> translate everything to the dominant target language.
- Preserve ALL formatting: bold, lists, tables, headers.
- Preserve technical terms, product names, and acronyms as-is (do not translate them).
- Translation must read naturally, not like machine translation.
- Do NOT add or remove any information during translation.`,

  add_examples: `Add concrete examples to illustrate the points in this text.

STRICT RULES:
- Add exactly 2-3 examples after the original text.
- Each example must be SPECIFIC: include real names, numbers, scenarios, or use cases.
- Do NOT use generic examples like "for example, a user might...". Be specific.
- Examples must be relevant to the product/domain described in this PRD.
- Keep the original text unchanged - only ADD examples below it.`,

  make_actionable: `Convert this text into clear, numbered action items.

STRICT RULES:
- Output must be a NUMBERED LIST of action items, maximum 7 items.
- Each item format: "[Number]. [Verb] [what specifically] [by whom/when if available]"
- Start each item with an imperative verb: Implement, Design, Create, Define, Review, Test, etc.
- Do NOT exceed 7 action items. Merge related points if needed.
- Each item must be concrete and executable, not vague.`,

  add_metrics: `Add measurable KPIs and targets to this text.

STRICT RULES:
- Add exactly 3-5 KPIs after the original text.
- Each KPI format: "**[Metric name]**: [baseline value] -> [target value] ([timeframe])"
- Every KPI MUST have a number. No vague targets like "improve" or "increase".
- If baseline data is unknown, use: "Current: TBD -> Target: [specific number]"
- KPIs must be directly measurable and relevant to the text content.
- Do NOT exceed 5 KPIs.`,

  simplify_jargon: `Replace technical jargon with plain language.

STRICT RULES:
- Replace every technical term or acronym with plain language equivalent.
- For jargon that cannot be avoided, add a brief explanation in parentheses.
- Example: "API endpoint" -> "connection point (API endpoint)"
- Do NOT change the meaning or remove information.
- Output may be slightly longer than original due to added explanations.
- Keep the same structure and paragraph count.`,

  to_table: `Convert this text into a markdown table.

STRICT RULES:
- Output MUST be a valid markdown table. No other format accepted.
- Minimum 2 columns, maximum 5 columns.
- Choose column headers that best organize the information.
- Every piece of information from the original text must appear in the table.
- Use "|" for column separators and "---" for header row separator.`,

  to_list: `Convert this text into a bullet point list.

STRICT RULES:
- Output MUST be bullet points using "- " prefix. No paragraphs allowed.
- Every piece of information from the original text must become a bullet.
- Each bullet must contain exactly 1 point or idea.
- No sub-bullets. Keep it flat.
- Order bullets logically (chronological, priority, or grouped by topic).`,
};

export function buildInlineSuggestPrompt(input: InlineSuggestInput): string {
  const { action, selectedText, sectionKey, surroundingContext } = input;

  const instruction = ACTION_INSTRUCTIONS[action] ?? 'Improve this text.';

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
