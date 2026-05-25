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

const ACTION_LABELS: Record<InlineAction, string> = {
  rewrite: 'Rewrite',
  expand: 'Expand',
  summarize: 'Summarize',
  shorter: 'Shorter',
  formal: 'More Formal',
  grammar: 'Fix Grammar',
  translate: 'Translate Auto-detect ID↔EN',
  add_examples: 'Add Examples',
  make_actionable: 'Make Actionable',
  add_metrics: 'Add Metrics',
  simplify_jargon: 'Simplify jargon',
  to_table: 'To Table',
  to_list: 'To List',
};

const ACTION_INSTRUCTIONS: Record<InlineAction, string> = {
  rewrite: `Rewrite the selected text so it is clearer, tighter, and easier to scan.

STRICT RULES:
- Keep the same meaning, scope, and factual claims.
- Do not invent facts, names, dates, numbers, metrics, owners, or scope.
- Keep the same format family as the original: paragraph stays paragraph, bullets stay bullets, table stays table.
- Preserve all product names, technical terms, acronyms, numbers, and decisions.
- Remove filler, vague qualifiers, repeated words, and indirect phrasing.
- Do not make it longer unless required for clarity.`,

  expand: `Expand the selected text with useful PRD-level detail while preserving the original intent.

STRICT RULES:
- Output must be 1.4x to 2x the original length, not more.
- Add concrete clarifications, edge cases, acceptance criteria, dependencies, or constraints that logically follow from the selected text.
- Do not invent facts, names, dates, numbers, metrics, owners, or scope.
- If a needed detail is unknown, phrase it as TBD or a decision to define, not as a fact.
- Keep the original key points and make them more complete; do not append unrelated sections.
- Avoid generic filler such as "improve user experience" unless the selected text already says that.`,

  summarize: `Summarize the selected text into the smallest useful version.

STRICT RULES:
- Output must be a flat bullet list with maximum 5 bullets.
- Each bullet must be one sentence and contain one idea.
- Preserve decisions, constraints, numbers, names, dates, and risks.
- Remove examples, repetition, background, and filler.
- Do not add new facts or interpretations.`,

  shorter: `Make the selected text 40-60% shorter without changing the meaning.

STRICT RULES:
- Output must have 40-60% fewer words than the original.
- Preserve all critical information: numbers, requirements, decisions, names, risks, and constraints.
- Cut filler words, duplicate points, unnecessary qualifiers, and repeated setup.
- Keep the same format family as the original when possible.
- Do not add new information.`,

  formal: `Rewrite the selected text in a professional, executive-ready tone.

STRICT RULES:
- Change tone and word choice only.
- Keep paragraph/list/table structure as close as possible to the original.
- Keep word count within 10% of the original.
- Remove slang, casual phrasing, and emotional wording.
- Do not add, remove, soften, or exaggerate facts.`,

  grammar: `Fix grammar, spelling, punctuation, and obvious syntax issues only.

STRICT RULES:
- Only correct errors: typos, grammar, spelling, punctuation, agreement, and awkward syntax.
- Do not rewrite correct sentences for style.
- Do not change tone, structure, order, meaning, or level of detail.
- Do not add or remove information.
- If there are no errors, return the text unchanged.`,

  translate: `Translate Auto-detect ID↔EN.

STRICT RULES:
- Auto-detect the input language.
- If input is Bahasa Indonesia -> translate to English.
- If input is English -> translate to Bahasa Indonesia.
- If input is mixed Bahasa Indonesia and English, translate into the dominant opposite language while preserving product names and technical terms.
- Do not summarize, rewrite, expand, or improve beyond translation.
- Preserve all formatting, numbers, requirements, decisions, acronyms, and product names.
- Translation must read naturally for a product/PRD audience.`,

  add_examples: `Add Examples that make the selected text more concrete.

STRICT RULES:
- Keep the original meaning and include 2-3 examples only.
- Examples must be specific to the selected text and surrounding PRD context.
- Use realistic product scenarios, user actions, constraints, or acceptance examples.
- Do not invent company-specific facts, names, metrics, owners, or dates.
- If exact data is unknown, use neutral placeholders like "for example" or "e.g." without pretending they are confirmed facts.
- Do not add a long explanation before or after the examples.`,

  make_actionable: `Make Actionable by converting the selected text into concrete next steps.

STRICT RULES:
- Output must be a numbered list with maximum 7 items.
- Start each item with an imperative verb such as Define, Design, Validate, Implement, Review, Measure, or Document.
- Each item must specify the action and expected output.
- Include owner, deadline, or dependency only if present in the selected text or surrounding context; otherwise omit it or mark TBD.
- Do not create scope that is not implied by the selected text.
- Avoid vague items like "Improve the flow"; say what to improve and how it will be checked.`,

  add_metrics: `Add Metrics by attaching measurable success criteria to the selected text.

STRICT RULES:
- Add exactly 3-5 metrics or KPIs.
- Every metric must include a numeric target, threshold, or measurement method.
- Use this format: "**Metric name**: Current: TBD -> Target: [specific measurable target] ([timeframe or event])".
- If baseline data is unknown, keep Current as TBD instead of inventing a baseline.
- Metrics must directly measure the selected requirement, risk, behavior, or goal.
- Do not add vanity metrics unless they are clearly relevant.`,

  simplify_jargon: `Simplify jargon so non-technical stakeholders can understand the selected text.

STRICT RULES:
- Replace jargon with plain language where it improves clarity.
- Keep necessary product, technical, legal, or analytics terms when removing them would make the text less precise.
- When a term must remain, add a short explanation in parentheses.
- Preserve meaning, facts, scope, and structure.
- Do not make the text childish, vague, or less useful for a PRD.`,

  to_table: `Convert the selected text to a table.

STRICT RULES:
- Output only a markdown table inside the text field.
- Do not add prose before or after the table.
- Use 2-5 columns with clear headers based on the content.
- Include every important point from the selected text exactly once.
- Keep cells concise and scannable.
- Do not invent missing data; use TBD only when a field is needed but absent.`,

  to_list: `Convert the selected text to a list.

STRICT RULES:
- Output only a flat bullet list using "- ".
- No intro sentence, no closing sentence, no nested bullets.
- Each bullet must contain exactly one idea.
- Preserve all important facts, numbers, requirements, decisions, risks, and constraints.
- Order bullets by priority, sequence, or logical grouping.
- Do not add new facts.`,
};

export function buildInlineSuggestPrompt(input: InlineSuggestInput): string {
  const { action, selectedText, sectionKey, surroundingContext } = input;

  const actionLabel = ACTION_LABELS[action];
  const instruction = ACTION_INSTRUCTIONS[action];

  return `You are editing a PRD section ("${sectionKey}"). The user selected specific text and chose: **${actionLabel}**.

## Instruction
${instruction}

## Selected text
${selectedText}

${surroundingContext ? `## Surrounding context (for reference only — do not copy unrelated context into the output)\n${surroundingContext}` : ''}

## Output Format
Return ONLY a valid JSON object — no markdown fences, no explanation:

{
  "suggestions": [
    {
      "text": "<replacement text>",
      "rationale": "<one concise sentence explaining what changed>"
    }
  ]
}

## Global Rules
- Provide exactly 3 variations, from most conservative to most creative.
- Each suggestion must be a direct drop-in replacement for the selected text.
- Preserve the selected text language unless the selected action is Translate Auto-detect ID↔EN.
- Do not invent facts, names, dates, numbers, metrics, owners, or scope.
- Use surrounding context only to avoid contradictions and keep domain relevance.
- Keep the output suitable for a PRD: specific, concrete, concise, and implementation-aware.
- No filler phrases, preambles, apologies, or meta commentary.
- Output valid JSON only.`;
}
