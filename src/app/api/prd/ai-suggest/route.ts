import { generateText } from 'ai';
import { requireUser } from '@/lib/auth/permissions';
import { getDefaultAIClient, updateProviderStats } from '@/lib/ai/client';
import { buildInlineSuggestPrompt, type InlineAction } from '@/lib/ai/prompts/inline-suggest';

export async function POST(request: Request) {
  await requireUser();
  const body = await request.json();
  const { action, selectedText, prdId: _prdId, sectionKey } = body;

  if (!action || !selectedText) {
    return Response.json(
      { error: 'Missing required fields: action, selectedText' },
      { status: 400 },
    );
  }

  // Get AI client
  let aiClient;
  try {
    aiClient = await getDefaultAIClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'No AI provider available';
    return Response.json({ error: msg }, { status: 503 });
  }

  // Build prompt
  const prompt = buildInlineSuggestPrompt({
    action: action as InlineAction,
    selectedText,
    sectionKey: sectionKey ?? 'unknown',
    surroundingContext: '',
  });

  const startMs = Date.now();

  try {
    const result = await generateText({
      model: aiClient.model,
      prompt,
      maxTokens: 2000,
      temperature: 0.7,
    });

    const latencyMs = Date.now() - startMs;
    updateProviderStats(aiClient.provider.id, true, latencyMs).catch(() => {});

    const rawText = result.text.trim();
    const jsonStr = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return Response.json({ error: 'AI returned invalid JSON', raw: rawText }, { status: 500 });
    }

    return Response.json({ suggestions: parsed.suggestions ?? [] });
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    const msg = err instanceof Error ? err.message : 'Suggestion failed';
    updateProviderStats(aiClient.provider.id, false, latencyMs, msg).catch(() => {});
    return Response.json({ error: msg }, { status: 500 });
  }
}
