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
1. You ONLY answer questions related to the PRD content provided. If the user asks about anything unrelated (weather, coding help, personal questions, general knowledge), politely decline in the response language: "I can only help with this PRD. Ask about the document content, structure, or quality." / "Saya hanya bisa membantu terkait PRD ini. Tanyakan tentang konten, struktur, atau kualitas dokumen ini."
2. Response language priority:
   - Default to the PRD document language provided below.
   - If the user explicitly asks for a different language, follow that explicit language request.
   - Do not switch languages just because a suggested prompt or system instruction is written in another language.
3. Be direct, specific, and actionable. No filler phrases like "Great question!" or "I'd be happy to help".
4. When suggesting improvements, quote the specific part and show the revised version in the response language.
5. Keep responses concise but thorough. Use bullet points for lists.
6. Reference specific PRD sections by name when relevant.`;

function detectDocumentLanguage(text: string): 'English' | 'Bahasa Indonesia' | 'Mixed' {
  const sample = text.toLowerCase().slice(0, 8000);
  if (!sample.trim()) return 'English';

  const idWords = [
    'yang',
    'dan',
    'dengan',
    'untuk',
    'dari',
    'pada',
    'adalah',
    'pengguna',
    'produk',
    'fitur',
    'tujuan',
    'risiko',
    'kebutuhan',
    'dalam',
    'sebagai',
    'akan',
    'harus',
    'dapat',
    'atau',
    'ini',
  ];
  const enWords = [
    'the',
    'and',
    'with',
    'for',
    'from',
    'users',
    'user',
    'product',
    'feature',
    'goal',
    'objective',
    'risk',
    'requirements',
    'scope',
    'will',
    'should',
    'must',
    'this',
    'that',
    'parking',
  ];

  const count = (words: string[]) =>
    words.reduce(
      (total, word) => total + (sample.match(new RegExp(`\b${word}\b`, 'g'))?.length ?? 0),
      0,
    );

  const idScore = count(idWords);
  const enScore = count(enWords);

  if (
    idScore >= 5 &&
    enScore >= 5 &&
    Math.min(idScore, enScore) / Math.max(idScore, enScore) > 0.35
  ) {
    return 'Mixed';
  }
  return idScore > enScore ? 'Bahasa Indonesia' : 'English';
}

function languageInstruction(language: 'English' | 'Bahasa Indonesia' | 'Mixed') {
  if (language === 'Bahasa Indonesia') {
    return 'The PRD document language is Bahasa Indonesia. Respond in Bahasa Indonesia unless the user explicitly asks for another language.';
  }
  if (language === 'Mixed') {
    return "The PRD document uses mixed English and Bahasa Indonesia. Respond in the dominant language of the PRD content; if unclear, use the language of the user's latest question.";
  }
  return 'The PRD document language is English. Respond in English unless the user explicitly asks for another language.';
}

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

  if (instruction && instruction.length > 5000) {
    return Response.json(
      { error: 'Instruction too long. Maximum 5000 characters.' },
      { status: 400 },
    );
  }

  if (selectedText && selectedText.length > 10000) {
    return Response.json(
      { error: 'Selected text too long. Maximum 10000 characters.' },
      { status: 400 },
    );
  }

  if (customInstruction && customInstruction.length > 5000) {
    return Response.json(
      { error: 'Custom instruction too long. Maximum 5000 characters.' },
      { status: 400 },
    );
  }

  const workspace = await getCurrentWorkspace(user.id);

  // For copilot mode: fetch PRD content as context
  let prdContext = '';
  let documentLanguage: 'English' | 'Bahasa Indonesia' | 'Mixed' = 'English';
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
        documentLanguage = detectDocumentLanguage(prdContext);
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
    system = `${COPILOT_SYSTEM}\n\nLANGUAGE CONTROL:\n${languageInstruction(documentLanguage)}`;
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
        documentLanguage: isCopilot ? documentLanguage : undefined,
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
          input_payload: {
            action,
            sectionKey,
            documentLanguage: isCopilot ? documentLanguage : undefined,
          },
          completed_at: new Date().toISOString(),
        })
        .then(
          () => {},
          () => {},
        );
    }

    // Log activity (fire-and-forget)
    if (workspace) {
      await logActivity({
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
        documentLanguage: isCopilot ? documentLanguage : undefined,
        userId: user.id,
      },
    }).catch(() => {});

    return Response.json({ error: 'AI suggestion failed. Please try again.' }, { status: 500 });
  }
}
