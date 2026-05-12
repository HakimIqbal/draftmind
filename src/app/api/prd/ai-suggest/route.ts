import { generateText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';
import { getCurrentWorkspace } from '@/lib/db/queries/workspace';
import { getDefaultAIClient, createAIClient, updateProviderStats } from '@/lib/ai/client';
import { buildInlineSuggestPrompt, type InlineAction } from '@/lib/ai/prompts/inline-suggest';
import { logToLangSmith } from '@/lib/ai/langsmith';
import { checkRateLimit, AI_RATE_LIMITS } from '@/lib/utils/rate-limit';
import { logError } from '@/lib/logging/system-log';
import { createAdminClient } from '@/lib/supabase/admin';
import { tiptapToPlainText } from '@/lib/prd/markdown';
import { logActivity } from '@/lib/logging/activity-log';
import type { TiptapContent } from '@/lib/prd/schema';

const COPILOT_SYSTEM = `You are a PRD Copilot — an expert product manager assistant embedded in a PRD editor.

RULES:
1. You ONLY answer questions related to the PRD content provided. If the user asks about anything unrelated (weather, coding help, personal questions, general knowledge), politely decline: "Saya hanya bisa membantu terkait PRD ini. Coba tanyakan tentang konten, struktur, atau kualitas dokumen kamu." (or in English if they write in English).
2. Match the user's language. If they write in Bahasa Indonesia, respond in Bahasa Indonesia. If English, respond in English.
3. Be direct, specific, and actionable. No filler phrases like "Great question!" or "I'd be happy to help".
4. When suggesting improvements, quote the specific part and show the revised version.
5. Keep responses concise but thorough. Use bullet points for lists.
6. Reference specific PRD sections by name when relevant.`;

export async function POST(request: Request) {
  const user = await requireUser();

  const rateCheck = checkRateLimit(`suggest:${user.id}`, AI_RATE_LIMITS.suggest);
  if (!rateCheck.allowed) {
    return Response.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  const body = await request.json();
  const {
    action,
    selectedText,
    prdId,
    sectionKey,
    instruction,
    chatHistory,
    providerId,
    customInstruction,
  } = body;

  if (!action || (!selectedText && !instruction)) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const workspace = await getCurrentWorkspace(user.id);

  // For copilot mode: fetch PRD content as context
  let prdContext = '';
  if (action === 'copilot' && prdId) {
    if (workspace) {
      const supabase = await createClient();
      const { data: prd } = await supabase
        .from('prds')
        .select('tiptap_content')
        .eq('id', prdId)
        .eq('workspace_id', workspace.id)
        .single();

      if (prd?.tiptap_content) {
        prdContext = tiptapToPlainText(prd.tiptap_content as unknown as TiptapContent).slice(
          0,
          6000,
        );
      }
    }
  }

  // Get AI client — use specific provider if requested
  let aiClient;
  try {
    aiClient = providerId ? await createAIClient(providerId) : await getDefaultAIClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'No AI provider available';
    logError('ai.suggest', msg, {}, user.id);
    return Response.json(
      { error: 'AI provider is not available. Please check your settings.' },
      { status: 503 },
    );
  }

  // Build prompt
  let prompt: string;
  let system: string | undefined;
  const isCopilot = action === 'copilot';

  if (isCopilot && instruction) {
    system = COPILOT_SYSTEM;
    const parts: string[] = [`## PRD Content\n${prdContext}`];
    if (chatHistory) parts.push(`\n## Conversation History\n${chatHistory}`);
    parts.push(`\n## Current Question\n${instruction}`);
    prompt = parts.join('\n');
  } else {
    prompt = buildInlineSuggestPrompt({
      action: action as InlineAction,
      selectedText: selectedText ?? '',
      sectionKey: sectionKey ?? 'unknown',
      surroundingContext: '',
      customInstruction: customInstruction as string | undefined,
    });
  }

  const startMs = Date.now();

  try {
    const result = await generateText({
      model: aiClient.model,
      ...(system ? { system } : {}),
      prompt,
      maxTokens: isCopilot ? 4000 : 2000,
      temperature: isCopilot ? 0.5 : 0.7,
    });

    const latencyMs = Date.now() - startMs;
    updateProviderStats(aiClient.provider.id, true, latencyMs).catch(() => {});

    logToLangSmith({
      name: isCopilot ? 'prd.copilot' : 'prd.ai-suggest',
      inputs: {
        action,
        instruction: instruction?.slice(0, 200),
        selectedText: selectedText?.slice(0, 200),
      },
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

    // Log to ai_runs (fire-and-forget)
    if (workspace) {
      const admin = createAdminClient();
      admin
        .from('ai_runs')
        .insert({
          workspace_id: workspace.id,
          prd_id: prdId || null,
          user_id: user.id,
          provider_id: aiClient.provider.id,
          type: isCopilot ? 'inline_suggest' : 'refine_section',
          status: 'success',
          model_used: aiClient.modelId,
          prompt_tokens: result.usage?.promptTokens ?? 0,
          completion_tokens: result.usage?.completionTokens ?? 0,
          total_tokens: result.usage?.totalTokens ?? 0,
          duration_ms: latencyMs,
          input_payload: { action, sectionKey },
          completed_at: new Date().toISOString(),
        })
        .then(
          () => {},
          () => {},
        );
    }

    // Log activity (fire-and-forget)
    if (workspace) {
      logActivity({
        workspaceId: workspace.id as string,
        actorId: user.id,
        type: isCopilot ? 'ai_copilot_used' : 'ai_suggest_used',
        resourceType: 'prd',
        resourceId: prdId || undefined,
        metadata: { action, section_key: sectionKey },
      });
    }

    if (isCopilot) {
      return Response.json({
        suggestions: [{ text: result.text.trim(), rationale: '' }],
        text: result.text.trim(),
        model: aiClient.provider.display_name,
      });
    }

    // Inline suggest — parse JSON
    const rawText = result.text.trim();
    const jsonStr = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      logError('ai.suggest', 'AI returned invalid JSON', { rawLength: rawText.length }, user.id);
      return Response.json({ error: 'AI suggestion failed. Please try again.' }, { status: 500 });
    }

    return Response.json({ suggestions: parsed.suggestions ?? [] });
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    const msg = err instanceof Error ? err.message : 'Suggestion failed';
    updateProviderStats(aiClient.provider.id, false, latencyMs, msg).catch(() => {});
    logError('ai.suggest', msg, { latencyMs, provider: aiClient.provider.id }, user.id);

    // Log failed run
    if (workspace) {
      const admin = createAdminClient();
      admin
        .from('ai_runs')
        .insert({
          workspace_id: workspace.id,
          prd_id: prdId || null,
          user_id: user.id,
          provider_id: aiClient.provider.id,
          type: isCopilot ? 'inline_suggest' : 'refine_section',
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
    }

    logToLangSmith({
      name: 'prd.ai-suggest',
      inputs: { action, selectedText: selectedText?.slice(0, 200) },
      error: msg,
      startTime: new Date(startMs),
      endTime: new Date(),
      metadata: {
        provider: aiClient.provider.display_name,
        model: aiClient.modelId,
        userId: user.id,
      },
    }).catch(() => {});

    return Response.json({ error: 'AI suggestion failed. Please try again.' }, { status: 500 });
  }
}
