export async function POST(request: Request) {
  const body = await request.json();
  const { action, selectedText } = body;

  if (!action || !selectedText) {
    return Response.json(
      { error: 'Missing required fields: action, selectedText' },
      { status: 400 },
    );
  }

  // Mock suggestions for Phase 3
  const suggestions = generateMockSuggestions(action, selectedText);

  return Response.json({ suggestions });
}

function generateMockSuggestions(action: string, text: string) {
  switch (action) {
    case 'rewrite':
      return [
        {
          text: `${text} — rewritten for improved clarity and readability.`,
          rationale: 'Improved clarity',
        },
        { text: `${text} — rephrased with more concise wording.`, rationale: 'More concise' },
        { text: `${text} — reworded with stronger action verbs.`, rationale: 'Stronger verbs' },
      ];
    case 'expand':
      return [
        {
          text: `${text} Additionally, this section provides further context and supporting details to strengthen the overall narrative.`,
          rationale: 'Added supporting context',
        },
        {
          text: `${text} Furthermore, consider the implications for key stakeholders and downstream teams who depend on this decision.`,
          rationale: 'Stakeholder perspective',
        },
        {
          text: `${text} To elaborate, the expected outcomes include improved efficiency, reduced overhead, and better alignment across teams.`,
          rationale: 'Concrete outcomes',
        },
      ];
    case 'summarize':
      return [
        {
          text:
            text
              .split(' ')
              .slice(0, Math.max(5, Math.floor(text.split(' ').length * 0.5)))
              .join(' ') + '.',
          rationale: 'Core message preserved',
        },
        {
          text: `In brief: ${text
            .split(' ')
            .slice(0, Math.max(4, Math.floor(text.split(' ').length * 0.4)))
            .join(' ')}.`,
          rationale: 'Executive summary style',
        },
        {
          text: `TL;DR — ${text
            .split(' ')
            .slice(0, Math.max(6, Math.floor(text.split(' ').length * 0.6)))
            .join(' ')}.`,
          rationale: 'Quick takeaway',
        },
      ];
    case 'shorter':
      return [
        {
          text:
            text
              .split(' ')
              .slice(0, Math.max(4, Math.floor(text.split(' ').length * 0.6)))
              .join(' ') + '.',
          rationale: 'Trimmed for brevity',
        },
        {
          text:
            text
              .split(' ')
              .slice(0, Math.max(3, Math.floor(text.split(' ').length * 0.5)))
              .join(' ') + '.',
          rationale: 'Condensed further',
        },
        {
          text:
            text
              .split(' ')
              .slice(0, Math.max(5, Math.floor(text.split(' ').length * 0.7)))
              .join(' ') + '.',
          rationale: 'Lightly shortened',
        },
      ];
    case 'formal':
      return [
        { text: `It is recommended that ${text.toLowerCase()}`, rationale: 'Professional tone' },
        {
          text: `Per the outlined requirements, ${text.toLowerCase()}`,
          rationale: 'Formal preamble',
        },
        {
          text: `In accordance with best practices, ${text.toLowerCase()}`,
          rationale: 'Authoritative framing',
        },
      ];
    case 'grammar':
      return [
        { text: `${text} [Grammar verified — no issues found]`, rationale: 'Grammar check passed' },
        { text: text, rationale: 'Original text is grammatically correct' },
        { text: `${text} [Minor punctuation adjusted]`, rationale: 'Punctuation refinement' },
      ];
    default:
      return [
        { text: `${text} [Variation 1]`, rationale: 'Alternative phrasing' },
        { text: `${text} [Variation 2]`, rationale: 'Different angle' },
        { text: `${text} [Variation 3]`, rationale: 'Fresh perspective' },
      ];
  }
}
