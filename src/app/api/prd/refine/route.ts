import { generateText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { logError } from '@/lib/logging/system-log';
import { checkRateLimit, AI_RATE_LIMITS } from '@/lib/utils/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDefaultAIClient, createAIClient, updateProviderStats } from '@/lib/ai/client';
import { buildRefineSectionPrompt } from '@/lib/ai/prompts/refine-section';
import { logToLangSmith } from '@/lib/ai/langsmith';
import { PRD_SECTION_LABELS, type PRDSectionKey } from '@/types/prd';
import type { PRDDocument } from '@/lib/prd/schema';
import { logActivity } from '@/lib/logging/activity-log';
import { prdToTiptap, countTiptapWords } from '@/lib/prd/tiptap-content';

const VALID_SECTION_KEYS = [
  'overview',
  'problem_statement',
  'objectives',
  'darci',
  'scope',
  'user_stories',
  'functional_reqs',
  'nfr',
  'success_metrics',
  'timeline',
  'risks',
  'references',
  'glossary',
  'changelog',
];

export async function POST(request: Request) {
  const user = await requireUser();

  const rateLimitResult = checkRateLimit(`refine:${user.id}`, AI_RATE_LIMITS.refine);
  if (!rateLimitResult.allowed) {
    return Response.json(
      { error: 'Too many requests. Please wait before refining again.' },
      { status: 429 },
    );
  }

  const workspace = await getCurrentWorkspace(user.id);
  if (!workspace) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { prdId, sectionKey, instruction, providerId } = await request.json();

  if (!prdId || !sectionKey || !instruction) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (instruction.length > 5000) {
    return Response.json(
      { error: 'Instruction too long. Maximum 5000 characters.' },
      { status: 400 },
    );
  }

  if (!VALID_SECTION_KEYS.includes(sectionKey)) {
    return Response.json({ error: `Invalid section key: ${sectionKey}` }, { status: 400 });
  }

  const supabase = await createClient();

  // 1. Fetch PRD — verify workspace ownership
  const { data: prd } = await supabase
    .from('prds')
    .select('title, content, tiptap_content, current_version')
    .eq('id', prdId)
    .eq('workspace_id', workspace.id)
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
    aiClient = providerId ? await createAIClient(providerId) : await getDefaultAIClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'No AI provider available';
    logError('prd.refine', msg, {}, user.id);
    return Response.json(
      { error: 'AI provider is not available. Please check your settings.' },
      { status: 503 },
    );
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

    logToLangSmith({
      name: 'prd.refine',
      inputs: { prdId, sectionKey, instruction: instruction.slice(0, 300) },
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

    const refinedText = result.text.trim();

    // Try parsing as JSON
    let refinedContent: unknown;
    try {
      const cleaned = refinedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      refinedContent = JSON.parse(cleaned);
    } catch {
      refinedContent = refinedText;
    }

    // 4. Update content.sections + attempt tiptap_content rebuild
    const updatedSections = { ...doc.sections, [sectionKey]: refinedContent };
    const updatedDoc = { ...doc, sections: updatedSections } as PRDDocument;

    // Calculate original word count for safety comparison
    const originalTiptap = prd.tiptap_content as Record<string, unknown> | null;
    const originalWordCount = originalTiptap ? countTiptapWords(originalTiptap) : 0;

    // Attempt to rebuild tiptap_content
    let newTiptap: unknown = null;
    let newWordCount = 0;
    try {
      newTiptap = prdToTiptap(updatedDoc);
      newWordCount = countTiptapWords(newTiptap as Record<string, unknown>);
    } catch {
      // prdToTiptap failed — will skip tiptap update
    }

    // Safety check: only update tiptap_content if result is reasonable
    // (at least 30% of original word count and non-empty)
    const ratio = originalWordCount > 0 ? newWordCount / originalWordCount : 0;
    const tiptapSafe = newTiptap && newWordCount > 0 && ratio >= 0.3;

    const updatePayload: Record<string, unknown> = {
      content: updatedDoc,
      updated_at: new Date().toISOString(),
    };
    if (tiptapSafe) {
      updatePayload.tiptap_content = newTiptap;
      updatePayload.word_count = newWordCount;
      updatePayload.read_time_minutes = Math.max(1, Math.round(newWordCount / 200));
    }

    await supabase.from('prds').update(updatePayload).eq('id', prdId);

    // Create version snapshot
    if (tiptapSafe && newTiptap) {
      const nextVersion = ((prd.current_version as number) ?? 0) + 1;
      const sectionLabel = PRD_SECTION_LABELS[sectionKey as PRDSectionKey] ?? sectionKey;
      await supabase.from('prd_versions').insert({
        prd_id: prdId,
        version_number: nextVersion,
        content: newTiptap,
        created_by: user.id,
        source: 'ai_refine',
        change_summary: `AI Refined: ${sectionLabel}`,
      });
      await supabase.from('prds').update({ current_version: nextVersion }).eq('id', prdId);
    }

    // Log to ai_runs
    const admin = createAdminClient();
    admin
      .from('ai_runs')
      .insert({
        workspace_id: workspace.id,
        prd_id: prdId,
        user_id: user.id,
        provider_id: aiClient.provider.id,
        type: 'refine_section',
        status: 'success',
        model_used: aiClient.modelId,
        prompt_tokens: result.usage?.promptTokens ?? 0,
        completion_tokens: result.usage?.completionTokens ?? 0,
        total_tokens: result.usage?.totalTokens ?? 0,
        duration_ms: latencyMs,
        input_payload: { sectionKey, instruction: instruction.slice(0, 500) },
        completed_at: new Date().toISOString(),
      })
      .then(
        () => {},
        () => {},
      );

    logActivity({
      workspaceId: workspace.id as string,
      actorId: user.id,
      type: 'ai_refinement_applied',
      resourceType: 'prd',
      resourceId: prdId,
      metadata: { section_key: sectionKey, provider: aiClient.provider.display_name },
    });

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
    logError('prd.refine', msg, { latencyMs, sectionKey }, user.id);

    const admin = createAdminClient();
    admin
      .from('ai_runs')
      .insert({
        workspace_id: workspace.id,
        prd_id: prdId,
        user_id: user.id,
        provider_id: aiClient.provider.id,
        type: 'refine_section',
        status: 'error',
        model_used: aiClient.modelId,
        duration_ms: latencyMs,
        error_message: msg,
        completed_at: new Date().toISOString(),
      })
      .then(
        () => {},
        () => {},
      );

    logToLangSmith({
      name: 'prd.refine',
      inputs: { prdId, sectionKey, instruction: instruction?.slice(0, 300) },
      error: msg,
      startTime: new Date(startMs),
      endTime: new Date(),
      metadata: {
        provider: aiClient.provider.display_name,
        model: aiClient.modelId,
        userId: user.id,
      },
    }).catch(() => {});

    return Response.json({ error: 'Failed to refine section. Please try again.' }, { status: 500 });
  }
}
