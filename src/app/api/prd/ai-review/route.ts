import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/permissions';
import { getDefaultAIClient, updateProviderStats } from '@/lib/ai/client';
import { buildAIReviewPrompt } from '@/lib/ai/prompts/ai-review';

export async function POST(request: Request) {
  const user = await requireUser();
  const { prdId } = await request.json();
  if (!prdId) return NextResponse.json({ error: 'Missing prdId' }, { status: 400 });

  const supabase = await createClient();

  // 1. Fetch PRD content
  const { data: prd, error: prdError } = await supabase
    .from('prds')
    .select('id, content, workspace_id')
    .eq('id', prdId)
    .single();

  if (prdError || !prd) {
    return NextResponse.json({ error: 'PRD not found' }, { status: 404 });
  }

  // 2. Get AI client
  let aiClient;
  try {
    aiClient = await getDefaultAIClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'No AI provider available';
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  // 3. Call AI
  const prompt = buildAIReviewPrompt(JSON.stringify(prd.content, null, 2));
  const startMs = Date.now();

  try {
    const result = await generateText({
      model: aiClient.model,
      prompt,
      maxTokens: 4000,
      temperature: 0.3,
    });

    const latencyMs = Date.now() - startMs;
    updateProviderStats(aiClient.provider.id, true, latencyMs).catch(() => {});

    // 4. Parse response
    const rawText = result.text.trim();
    // Remove potential markdown fences
    const jsonStr = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: 'AI returned invalid JSON', raw: rawText },
        { status: 500 },
      );
    }

    const findings = parsed.findings ?? [];
    const healthScore = parsed.health_score ?? 0;
    const breakdown = parsed.breakdown ?? {};

    // 5. Store findings in database
    const admin = createAdminClient();

    // Delete old findings for this PRD
    await admin.from('ai_review_findings').delete().eq('prd_id', prdId);

    // Insert new findings
    if (findings.length > 0) {
      await admin.from('ai_review_findings').insert(
        findings.map((f: Record<string, unknown>) => ({
          prd_id: prdId,
          severity: f.severity,
          section_key: f.section_key,
          title: f.title,
          description: f.description,
          suggested_fix: f.suggested_fix ?? null,
        })),
      );
    }

    // 6. Update PRD health score
    await supabase
      .from('prds')
      .update({
        health_score: healthScore,
        health_breakdown: breakdown,
        updated_at: new Date().toISOString(),
      })
      .eq('id', prdId);

    // 7. Log AI run
    await admin.from('ai_runs').insert({
      prd_id: prdId,
      workspace_id: prd.workspace_id,
      user_id: user.id,
      type: 'review',
      status: 'completed',
      provider_id: aiClient.provider.id,
      model_id: aiClient.modelId,
      input_tokens: result.usage?.promptTokens ?? 0,
      output_tokens: result.usage?.completionTokens ?? 0,
      latency_ms: latencyMs,
    });

    return NextResponse.json({ findings, health_score: healthScore, breakdown });
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    const msg = err instanceof Error ? err.message : 'AI review failed';
    updateProviderStats(aiClient.provider.id, false, latencyMs, msg).catch(() => {});
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
