import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { logError, logInfo } from '@/lib/logging/system-log';
import { checkRateLimit, AI_RATE_LIMITS } from '@/lib/utils/rate-limit';
import { getDefaultAIClient, createAIClient, updateProviderStats } from '@/lib/ai/client';
import { buildAIReviewPrompt } from '@/lib/ai/prompts/ai-review';
import { logToLangSmith } from '@/lib/ai/langsmith';
import { sendNotification } from '@/lib/notifications/send';
import { logActivity } from '@/lib/logging/activity-log';

export async function POST(request: Request) {
  const user = await requireUser();

  const rateLimitResult = checkRateLimit(`review:${user.id}`, AI_RATE_LIMITS.review);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before reviewing again.' },
      { status: 429 },
    );
  }

  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { prdId, providerId } = await request.json();
  if (!prdId) return NextResponse.json({ error: 'Missing prdId' }, { status: 400 });

  const supabase = await createClient();

  // 1. Fetch PRD content — verify workspace ownership
  const { data: prd, error: prdError } = await supabase
    .from('prds')
    .select('id, content, workspace_id')
    .eq('id', prdId)
    .eq('workspace_id', workspace.id)
    .single();

  if (prdError || !prd) {
    return NextResponse.json({ error: 'PRD not found' }, { status: 404 });
  }

  // Block AI Review for template PRDs until template-aware review is implemented
  const prdContent = prd.content as Record<string, unknown>;
  const generationMode = (prdContent?.metadata as Record<string, unknown>)?.generation_mode;
  if (generationMode === 'template') {
    return NextResponse.json(
      {
        error:
          'AI Review is not yet available for template-generated PRDs. This feature will be added in a future update.',
        template_blocked: true,
      },
      { status: 422 },
    );
  }

  // 2. Get AI client
  let aiClient;
  try {
    aiClient = providerId ? await createAIClient(providerId) : await getDefaultAIClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'No AI provider available';
    logError('prd.review', msg, {}, user.id);
    return NextResponse.json(
      { error: 'AI provider is not available. Please check your settings.' },
      { status: 503 },
    );
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

    // Log to LangSmith
    logToLangSmith({
      name: 'prd.ai-review',
      inputs: { prdId, contentLength: JSON.stringify(prd.content).length },
      outputs: { tokensUsed: result.usage?.totalTokens ?? 0 },
      startTime: new Date(startMs),
      endTime: new Date(),
      metadata: {
        provider: aiClient.provider.display_name,
        model: aiClient.modelId,
        latencyMs,
        userId: user.id,
      },
      usage: result.usage,
    }).catch(() => {});

    // 4. Parse response
    const rawText = result.text.trim();
    // Remove potential markdown fences
    const jsonStr = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: 'AI review returned an unexpected format. Please try again.' },
        { status: 500 },
      );
    }

    const findings = parsed.findings ?? [];
    const healthScore = parsed.health_score ?? 0;
    const breakdown = parsed.breakdown ?? {};

    // 5. Log AI run first (needed for findings FK)
    const admin = createAdminClient();

    const { data: aiRun } = await admin
      .from('ai_runs')
      .insert({
        prd_id: prdId,
        workspace_id: prd.workspace_id,
        user_id: user.id,
        type: 'ai_review',
        status: 'success',
        provider_id: aiClient.provider.id,
        model_used: aiClient.modelId,
        prompt_tokens: result.usage?.promptTokens ?? 0,
        completion_tokens: result.usage?.completionTokens ?? 0,
        total_tokens: result.usage?.totalTokens ?? 0,
        duration_ms: latencyMs,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // 6. Store findings in database
    // Delete old findings for this PRD
    await admin.from('ai_review_findings').delete().eq('prd_id', prdId);

    // Insert new findings (with ai_run_id FK)
    if (findings.length > 0 && aiRun) {
      await admin.from('ai_review_findings').insert(
        findings.map((f: Record<string, unknown>) => ({
          ai_run_id: aiRun.id,
          prd_id: prdId,
          severity: f.severity,
          section_key: f.section_key,
          title: f.title,
          description: f.description,
          suggested_fix: f.suggested_fix ?? null,
        })),
      );
    }

    // 7. Update PRD health score
    await supabase
      .from('prds')
      .update({
        health_score: healthScore,
        health_breakdown: breakdown,
        updated_at: new Date().toISOString(),
      })
      .eq('id', prdId);

    // Notify PRD owner that AI review is done
    const { data: prdFull } = await supabase
      .from('prds')
      .select('owner_id, title')
      .eq('id', prdId)
      .single();

    if (prdFull && prdFull.owner_id) {
      sendNotification({
        recipientId: prdFull.owner_id,
        workspaceId: workspace.id as string,
        type: 'ai_suggestion_ready',
        title: 'AI Review completed',
        body: `Review for "${prdFull.title}" is ready — score: ${healthScore}/100, ${findings.length} finding${findings.length !== 1 ? 's' : ''}`,
        resourceType: 'prd',
        resourceId: prdId,
        actionUrl: `/prds/${prdId}/ai-review`,
      });
    }

    await logActivity({
      workspaceId: workspace.id as string,
      actorId: user.id,
      type: 'ai_review_completed',
      resourceType: 'prd',
      resourceId: prdId,
      metadata: {
        health_score: healthScore,
        findings_count: findings.length,
        provider: aiClient.provider.display_name,
      },
    });
    logInfo(
      'prd.ai-review',
      `AI Review done: '${prdFull?.title ?? prdId}', score: ${healthScore}`,
      { prdId, healthScore, findingsCount: findings.length },
      user.id,
    );

    return NextResponse.json({ findings, health_score: healthScore, breakdown });
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    const msg = err instanceof Error ? err.message : 'AI review failed';
    updateProviderStats(aiClient.provider.id, false, latencyMs, msg).catch(() => {});
    logError('prd.review', msg, { latencyMs, prdId }, user.id);

    logToLangSmith({
      name: 'prd.ai-review',
      inputs: { prdId },
      error: msg,
      startTime: new Date(startMs),
      endTime: new Date(),
      metadata: {
        provider: aiClient.provider.display_name,
        model: aiClient.modelId,
        userId: user.id,
      },
    }).catch(() => {});

    return NextResponse.json({ error: 'AI review failed. Please try again.' }, { status: 500 });
  }
}
