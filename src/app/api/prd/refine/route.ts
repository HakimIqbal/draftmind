import { generateText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';
import { getDefaultAIClient, updateProviderStats } from '@/lib/ai/client';
import { buildRefineSectionPrompt } from '@/lib/ai/prompts/refine-section';
import { PRD_SECTION_LABELS, type PRDSectionKey } from '@/types/prd';
import type { PRDDocument } from '@/lib/prd/schema';

export async function POST(request: Request) {
  await requireUser();
  const { prdId, sectionKey, instruction } = await request.json();

  if (!prdId || !sectionKey || !instruction) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = await createClient();

  // 1. Fetch PRD
  const { data: prd } = await supabase
    .from('prds')
    .select('title, content')
    .eq('id', prdId)
    .single();

  if (!prd) {
    return Response.json({ error: 'PRD not found' }, { status: 404 });
  }

  const doc = prd.content as PRDDocument;
  const currentContent = doc.sections[sectionKey as keyof typeof doc.sections];
  const originalText =
    typeof currentContent === 'string' ? currentContent : JSON.stringify(currentContent, null, 2);

  // 2. Get AI client
  let aiClient;
  try {
    aiClient = await getDefaultAIClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'No AI provider available';
    return Response.json({ error: msg }, { status: 503 });
  }

  // 3. Call AI
  const prompt = buildRefineSectionPrompt({
    sectionKey,
    sectionLabel: PRD_SECTION_LABELS[sectionKey as PRDSectionKey] ?? sectionKey,
    currentContent,
    instruction,
    prdTitle: prd.title,
  });

  const startMs = Date.now();

  try {
    const result = await generateText({
      model: aiClient.model,
      prompt,
      maxTokens: 4000,
      temperature: 0.4,
    });

    const latencyMs = Date.now() - startMs;
    updateProviderStats(aiClient.provider.id, true, latencyMs).catch(() => {});

    const refinedText = result.text.trim();

    // Try parsing as JSON to update the PRD content
    let refinedContent: unknown;
    try {
      const cleaned = refinedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      refinedContent = JSON.parse(cleaned);
    } catch {
      refinedContent = refinedText;
    }

    // 4. Update PRD section content
    const updatedSections = { ...doc.sections, [sectionKey]: refinedContent };
    await supabase
      .from('prds')
      .update({
        content: { ...doc, sections: updatedSections },
        updated_at: new Date().toISOString(),
      })
      .eq('id', prdId);

    return Response.json({
      original: originalText,
      refined:
        typeof refinedContent === 'string'
          ? refinedContent
          : JSON.stringify(refinedContent, null, 2),
      changes: 1,
    });
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    const msg = err instanceof Error ? err.message : 'Refine failed';
    updateProviderStats(aiClient.provider.id, false, latencyMs, msg).catch(() => {});
    return Response.json({ error: msg }, { status: 500 });
  }
}
