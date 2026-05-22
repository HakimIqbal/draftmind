import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/permissions';
import { updateProviderStats } from '@/lib/ai/client';
import { PROVIDER_REGISTRY } from '@/lib/ai/providers';
import { decryptApiKey } from '@/lib/utils/crypto';
import { buildGeneratePRDPrompt } from '@/lib/ai/prompts/generate-prd';
import { SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import { AIGeneratedSectionsSchema } from '@/lib/ai/schema';
import type { AIGeneratedSections } from '@/lib/ai/schema';
import { createEmptyPRD } from '@/lib/prd/schema';
import type { PRDDocument } from '@/lib/prd/schema';
import { prdToTiptap } from '@/lib/prd/tiptap-content';
import { computeHealthScore } from '@/lib/prd/health-score';
import { generateObject, generateText } from 'ai';
import { checkRateLimit, AI_RATE_LIMITS } from '@/lib/utils/rate-limit';
import { logError, logWarn } from '@/lib/logging/system-log';
import { logToLangSmith } from '@/lib/ai/langsmith';
import { logActivity } from '@/lib/logging/activity-log';

// ---------------------------------------------------------------------------
// Convert AI output sections into a PRDDocument
// ---------------------------------------------------------------------------

function aiSectionsToPRDDocument(
  sections: AIGeneratedSections,
  userId: string,
  title: string,
): PRDDocument {
  const prd = createEmptyPRD(userId, title);

  // Overview (rich text) — skip if empty
  if (sections.overview) {
    prd.sections.overview = {
      content: {
        type: 'doc',
        content: sections.overview
          .split('\n\n')
          .filter(Boolean)
          .map((p) => ({
            type: 'paragraph',
            content: [{ type: 'text', text: p }],
          })),
      },
      word_count: sections.overview.split(/\s+/).filter(Boolean).length,
      ai_generated: true,
    };
  }

  // Problem Statement (rich text) — skip if empty
  if (sections.problem_statement) {
    prd.sections.problem_statement = {
      content: {
        type: 'doc',
        content: sections.problem_statement
          .split('\n\n')
          .filter(Boolean)
          .map((p) => ({
            type: 'paragraph',
            content: [{ type: 'text', text: p }],
          })),
      },
      word_count: sections.problem_statement.split(/\s+/).filter(Boolean).length,
      ai_generated: true,
    };
  }

  // Objectives — skip if empty
  if (sections.objectives && sections.objectives.length > 0) {
    prd.sections.objectives = sections.objectives.map((obj, i) => ({
      id: `OBJ-${String(i + 1).padStart(3, '0')}`,
      type: 'goal' as const,
      description: obj.statement,
      key_results: [obj.measurable_outcome],
    }));
  }

  // DARCI — handle both old format (string/array) and new format (object with people/guidelines)
  const parseDarciRole = (role: unknown) => {
    if (!role) return { people: [], guidelines: '' };
    if (typeof role === 'string') return { people: [role], guidelines: '' };
    if (Array.isArray(role)) return { people: role, guidelines: '' };
    if (typeof role === 'object' && role !== null) {
      const r = role as Record<string, unknown>;
      return {
        people: Array.isArray(r.people)
          ? (r.people as string[])
          : r.people
            ? [String(r.people)]
            : [],
        guidelines: typeof r.guidelines === 'string' ? r.guidelines : '',
      };
    }
    return { people: [], guidelines: '' };
  };
  if (sections.darci) {
    prd.sections.darci = {
      decider: parseDarciRole(sections.darci.decider),
      accountable: parseDarciRole(sections.darci.accountable),
      responsible: parseDarciRole(sections.darci.responsible),
      consulted: parseDarciRole(sections.darci.consulted),
      informed: parseDarciRole(sections.darci.informed),
    };
  }

  // Scope
  if (sections.scope) {
    prd.sections.scope = {
      in_scope: sections.scope.in_scope,
      out_of_scope: sections.scope.out_of_scope,
    };
  }

  // User Stories
  if (sections.user_stories && sections.user_stories.length > 0)
    prd.sections.user_stories = sections.user_stories.map((story, i) => ({
      id: `US-${String(i + 1).padStart(3, '0')}`,
      role: story.role,
      want: story.want,
      benefit: story.benefit,
      acceptance_criteria: story.acceptance_criteria,
      priority: (story.priority && ['must', 'should', 'could', 'wont'].includes(story.priority)
        ? story.priority
        : 'should') as 'must' | 'should' | 'could' | 'wont',
    }));

  // Functional Requirements
  if (sections.functional_reqs && sections.functional_reqs.length > 0)
    prd.sections.functional_reqs = sections.functional_reqs.map((req, i) => ({
      id: `FR-${String(i + 1).padStart(3, '0')}`,
      priority: mapPriority(req.priority),
      title: req.title,
      description: req.description,
      dependencies: [],
    }));

  // NFR
  if (sections.nfr) {
    prd.sections.nfr = {
      performance: sections.nfr.performance ? [sections.nfr.performance] : [],
      security: sections.nfr.security ? [sections.nfr.security] : [],
      accessibility: sections.nfr.accessibility ? [sections.nfr.accessibility] : [],
      scalability: sections.nfr.scalability ? [sections.nfr.scalability] : [],
      reliability: [],
      compliance: [],
    };
  }

  // Success Metrics
  if (sections.success_metrics && sections.success_metrics.length > 0)
    prd.sections.success_metrics = sections.success_metrics.map((m, i) => ({
      id: `SM-${String(i + 1).padStart(3, '0')}`,
      name: m.name,
      definition: m.definition ?? '',
      baseline: m.baseline ?? '',
      target: m.target,
      measurement_window: m.measurement_window,
    }));

  // Timeline
  if (sections.timeline && sections.timeline.length > 0)
    prd.sections.timeline = sections.timeline.map((ms, i) => ({
      id: `MS-${String(i + 1).padStart(3, '0')}`,
      title: ms.title,
      date: ms.date,
      activity: ms.activity ?? '',
      deliverables: ms.deliverable
        ? Array.isArray(ms.deliverable)
          ? ms.deliverable
          : [ms.deliverable]
        : (ms.deliverables ?? []),
      pic: ms.pic ?? '',
      status: 'planned' as const,
    }));

  // Risks
  if (sections.risks && sections.risks.length > 0)
    prd.sections.risks = sections.risks.map((r, i) => ({
      id: `RISK-${String(i + 1).padStart(3, '0')}`,
      description: r.description,
      likelihood: r.likelihood,
      impact: r.impact,
      mitigation: r.mitigation,
    }));

  // References
  if (sections.references && sections.references.length > 0)
    prd.sections.references = sections.references.map((ref, i) => ({
      id: `REF-${String(i + 1).padStart(3, '0')}`,
      type: (ref.type as 'document' | 'url' | 'other') || 'other',
      url: ref.url,
      title: ref.title,
    }));

  // Glossary
  if (sections.glossary && sections.glossary.length > 0)
    prd.sections.glossary = sections.glossary.map((g) => ({
      term: g.term,
      definition: g.definition,
    }));

  // Changelog
  if (sections.changelog && sections.changelog.length > 0)
    prd.sections.changelog = sections.changelog.map((c) => ({
      version: c.version,
      date: c.date,
      author: c.author,
      summary: c.summary,
    }));

  return prd;
}

function mapPriority(priority: string): 'must' | 'should' | 'could' | 'wont' {
  const p = priority.toLowerCase();
  if (p.includes('must')) return 'must';
  if (p.includes('should')) return 'should';
  if (p.includes('nice') || p.includes('could')) return 'could';
  return 'should';
}

// ---------------------------------------------------------------------------
// Count words in a PRD document
// ---------------------------------------------------------------------------

function countDocumentWords(prd: PRDDocument): number {
  const texts: string[] = [];

  // Rich text sections
  const extractText = (content: { content: Record<string, unknown>[] }): string => {
    const parts: string[] = [];
    for (const node of content.content) {
      if (typeof node.text === 'string') parts.push(node.text);
      if (Array.isArray(node.content)) {
        parts.push(extractText({ content: node.content as Record<string, unknown>[] }));
      }
    }
    return parts.join(' ');
  };

  texts.push(extractText(prd.sections.overview.content));
  texts.push(extractText(prd.sections.problem_statement.content));

  for (const obj of prd.sections.objectives) {
    texts.push(obj.description, ...obj.key_results);
  }
  for (const story of prd.sections.user_stories) {
    texts.push(story.role, story.want, story.benefit, ...story.acceptance_criteria);
  }
  for (const req of prd.sections.functional_reqs) {
    texts.push(req.title, req.description);
  }
  for (const m of prd.sections.success_metrics) {
    texts.push(m.name, m.baseline, m.target, m.measurement_window);
  }
  for (const ms of prd.sections.timeline) {
    texts.push(ms.title, ...ms.deliverables);
  }
  for (const r of prd.sections.risks) {
    texts.push(r.description, r.mitigation);
  }

  const all = texts.filter(Boolean).join(' ');
  return all.split(/\s+/).filter(Boolean).length;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const startMs = Date.now();
  let activityContext: {
    workspaceId: string | null;
    userId: string | null;
    prdId: string | null;
    aiRunId: string | null;
    title?: string | null;
  } = {
    workspaceId: null,
    userId: null,
    prdId: null,
    aiRunId: null,
    title: null,
  };

  try {
    const user = await requireUser();

    // Rate limit check
    const rateCheck = checkRateLimit(`generate:${user.id}`, AI_RATE_LIMITS.generate);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many generation requests. Please wait a moment.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) },
        },
      );
    }

    const supabase = await createClient();

    const body = await request.json();
    const { prdId, aiRunId } = body;

    if (!prdId || !aiRunId) {
      return NextResponse.json({ error: 'Missing prdId or aiRunId' }, { status: 400 });
    }

    // Fetch ai_run
    const { data: aiRun, error: aiRunError } = await supabase
      .from('ai_runs')
      .select('*')
      .eq('id', aiRunId)
      .single();

    if (aiRunError || !aiRun) {
      return NextResponse.json({ error: 'AI run not found' }, { status: 404 });
    }

    if (aiRun.status !== 'queued' && aiRun.status !== 'running') {
      return NextResponse.json(
        { error: 'AI run is not in a runnable state', status: aiRun.status },
        { status: 400 },
      );
    }

    // Mark as running
    await supabase.from('ai_runs').update({ status: 'running' }).eq('id', aiRunId);

    // Fetch PRD
    const { data: prd } = await supabase.from('prds').select('*').eq('id', prdId).single();

    if (!prd) {
      await supabase
        .from('ai_runs')
        .update({ status: 'error', error_message: 'PRD not found' })
        .eq('id', aiRunId);
      return NextResponse.json({ error: 'PRD not found' }, { status: 404 });
    }

    // Get workspace_id from the ai_run
    const workspaceId = aiRun.workspace_id;
    const inputPayload = aiRun.input_payload as {
      brief: string;
      title: string;
      project_tag?: string;
      stakeholders?: string;
      team_members?: string[];
      team_member_roles?: string[];
      problem_statement?: string;
      target_users?: string;
      constraints?: string;
      success_criteria?: string;
      platform?: string;
      priority?: string;
      tech_stack?: string;
      design_link?: string;
      start_date?: string;
      end_date?: string;
    };

    activityContext = {
      workspaceId,
      userId: user.id,
      prdId,
      aiRunId,
      title: inputPayload.title,
    };

    await logActivity({
      workspaceId,
      actorId: user.id,
      type: 'ai_generation_started',
      resourceType: 'prd',
      resourceId: prdId,
      metadata: {
        title: inputPayload.title,
      },
    });

    // Build prompt with ALL context from input payload
    const stakeholderNames = inputPayload.stakeholders
      ? inputPayload.stakeholders
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

    const userPrompt = buildGeneratePRDPrompt({
      brief: inputPayload.brief,
      title: inputPayload.title,
      ownerName: user.user_metadata?.full_name || user.email || 'User',
      stakeholderNames,
      startDate: inputPayload.start_date,
      endDate: inputPayload.end_date,
      problemStatement: inputPayload.problem_statement,
      targetUsers: inputPayload.target_users,
      teamMembers: inputPayload.team_members
        ?.map((name, i) => {
          const role = inputPayload.team_member_roles?.[i];
          return role ? `${name} (${role})` : name;
        })
        .join(', '),
      constraints: inputPayload.constraints,
      successCriteria: inputPayload.success_criteria,
      platform: inputPayload.platform,
      priority: inputPayload.priority,
      techStack: inputPayload.tech_stack,
      designLink: inputPayload.design_link,
      templateName: (inputPayload as Record<string, unknown>).template_name as string | undefined,
      templateSections: (inputPayload as Record<string, unknown>).template_sections as
        | { name: string; guidelines: string }[]
        | undefined,
    });

    // Try ALL providers in priority order with real fallback
    let aiSections: AIGeneratedSections = undefined!;
    let modelUsed = 'pending';
    let tokensUsed = 0;
    let _providerId: string | null = null;
    const providerErrors: string[] = [];

    // Get all active providers
    const adminClient = createAdminClient();
    const { data: allProviders } = await adminClient
      .from('providers')
      .select(
        'id, type, display_name, default_model, base_url, api_key_encrypted, status, priority',
      )
      .eq('status', 'active')
      .order('priority', { ascending: true });

    // If user preferred a specific provider, move it to front of list
    const preferredId = (inputPayload as Record<string, unknown>).preferred_provider_id as
      | string
      | undefined;
    if (preferredId && allProviders) {
      const idx = allProviders.findIndex((p) => p.id === preferredId);
      if (idx > 0) {
        const preferred = allProviders.splice(idx, 1)[0]!;
        allProviders.unshift(preferred);
      }
    }

    if (!allProviders || allProviders.length === 0) {
      const durationMs = Date.now() - startMs;
      await supabase
        .from('ai_runs')
        .update({
          status: 'error',
          error_message: 'No AI provider configured',
          duration_ms: durationMs,
        })
        .eq('id', aiRunId);
      return NextResponse.json({ error: 'No AI provider configured' }, { status: 503 });
    }

    let generationSucceeded = false;

    for (const provider of allProviders) {
      const config = PROVIDER_REGISTRY[provider.type];
      if (!config) continue;

      try {
        const apiKey = decryptApiKey(provider.api_key_encrypted);
        const model = config.createModel(
          apiKey,
          provider.default_model,
          provider.base_url ?? undefined,
        );

        modelUsed = provider.default_model;
        _providerId = provider.id;

        // Update status to running
        await supabase
          .from('ai_runs')
          .update({ status: 'running', model_used: `${provider.display_name}/${modelUsed}` })
          .eq('id', aiRunId);

        // Call AI with structured output (schema-enforced)
        let result;
        try {
          // Try generateObject first (structured output mode)
          const objectResult = await generateObject({
            model,
            schema: AIGeneratedSectionsSchema,
            system: SYSTEM_PROMPT,
            prompt: userPrompt,
            maxTokens: 65000,
            temperature: 0.25,
          });

          aiSections = objectResult.object;
          tokensUsed = objectResult.usage?.totalTokens ?? 0;
        } catch (structuredError) {
          // Fallback to generateText + manual parse if provider doesn't support structured output
          logWarn(
            'prd.generate',
            `Structured output failed for ${provider.display_name}, falling back to generateText`,
            {
              error:
                structuredError instanceof Error
                  ? structuredError.message
                  : String(structuredError),
              provider: provider.display_name,
            },
            user.id,
          );

          result = await generateText({
            model,
            system: SYSTEM_PROMPT,
            prompt:
              userPrompt +
              '\n\nIMPORTANT: Output ONLY a valid JSON object matching the PRD schema. No markdown fences, no explanation, no text before or after the JSON. Generate ALL 14 sections with full detail.',
            maxTokens: 65000,
            temperature: 0.25,
          });

          tokensUsed = result.usage?.totalTokens ?? 0;

          let jsonText = result.text.trim();

          // Strip markdown fences if present
          const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (fenceMatch) {
            jsonText = fenceMatch[1]!.trim();
          }

          // Try to repair truncated JSON by closing open braces/brackets
          let parsed;
          try {
            parsed = JSON.parse(jsonText);
          } catch {
            logWarn(
              'prd.generate',
              'JSON parse failed, attempting repair',
              { length: jsonText.length, tail: jsonText.slice(-100) },
              user.id,
            );

            // Count unclosed braces/brackets and close them
            let openBraces = 0;
            let openBrackets = 0;
            let inString = false;
            let escaped = false;
            for (const ch of jsonText) {
              if (escaped) {
                escaped = false;
                continue;
              }
              if (ch === '\\') {
                escaped = true;
                continue;
              }
              if (ch === '"') {
                inString = !inString;
                continue;
              }
              if (inString) continue;
              if (ch === '{') openBraces++;
              if (ch === '}') openBraces--;
              if (ch === '[') openBrackets++;
              if (ch === ']') openBrackets--;
            }

            // Close any strings that are open
            if (inString) jsonText += '"';
            // Close brackets and braces
            for (let k = 0; k < openBrackets; k++) jsonText += ']';
            for (let k = 0; k < openBraces; k++) jsonText += '}';

            try {
              parsed = JSON.parse(jsonText);
            } catch (repairErr) {
              logError(
                'prd.generate',
                'JSON repair also failed',
                { error: repairErr instanceof Error ? repairErr.message : String(repairErr) },
                user.id,
              );
              throw new Error('AI returned malformed JSON that could not be repaired');
            }
          }

          const validation = AIGeneratedSectionsSchema.safeParse(parsed);
          if (validation.success) {
            aiSections = validation.data;
          } else if (parsed.overview) {
            aiSections = parsed as AIGeneratedSections;
          } else {
            logError(
              'prd.generate',
              'AI output validation failed',
              { issues: validation.error.issues.slice(0, 5) },
              user.id,
            );
            throw new Error('AI output did not match expected PRD schema');
          }
        }

        // Update provider stats on success
        updateProviderStats(provider.id, true, Date.now() - startMs).catch(() => {});
        generationSucceeded = true;

        // Log to LangSmith
        logToLangSmith({
          name: 'prd.generate',
          inputs: {
            title: inputPayload.title,
            brief: inputPayload.brief?.slice(0, 500),
            model: modelUsed,
          },
          outputs: { health_score: 0, word_count: 0, sections: Object.keys(aiSections).length },
          startTime: new Date(startMs),
          endTime: new Date(),
          metadata: {
            provider: provider.display_name,
            model: modelUsed,
            tokens: tokensUsed,
            prdId,
            userId: user.id,
          },
          usage: { totalTokens: tokensUsed },
        }).catch(() => {});

        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        providerErrors.push(`${provider.display_name}: ${msg}`);
        logError(
          'prd.generate',
          `Provider ${provider.display_name} failed`,
          { error: msg, provider: provider.display_name },
          user.id,
        );
        updateProviderStats(provider.id, false, Date.now() - startMs, msg).catch(() => {});
        continue; // Try next provider
      }
    }

    if (!generationSucceeded) {
      const allErrorsMsg = `All providers failed: ${providerErrors.join(' | ')}`;
      logError('prd.generate', 'All providers failed', { errors: providerErrors, prdId }, user.id);

      // Log failure to LangSmith
      logToLangSmith({
        name: 'prd.generate',
        inputs: { title: inputPayload.title, brief: inputPayload.brief?.slice(0, 500) },
        error: allErrorsMsg,
        startTime: new Date(startMs),
        endTime: new Date(),
        metadata: { prdId, userId: user.id, providerErrors },
      }).catch(() => {});
      const durationMs = Date.now() - startMs;
      await supabase
        .from('ai_runs')
        .update({
          status: 'error',
          error_message: allErrorsMsg,
          duration_ms: durationMs,
        })
        .eq('id', aiRunId);

      await logActivity({
        workspaceId,
        actorId: user.id,
        type: 'ai_generation_failed',
        resourceType: 'prd',
        resourceId: prdId,
        metadata: {
          title: inputPayload.title,
          duration_ms: durationMs,
          error: allErrorsMsg.slice(0, 500),
        },
      });

      return NextResponse.json(
        { error: 'AI provider could not generate the PRD. Please try again.' },
        { status: 500 },
      );
    }

    // Convert to PRDDocument
    const prdDocument = aiSectionsToPRDDocument(aiSections, user.id, inputPayload.title);

    // Enrich metadata with form data
    const ownerName =
      (user.user_metadata as Record<string, string> | undefined)?.full_name ?? user.email ?? 'User';
    prdDocument.metadata.owner_name = ownerName;
    prdDocument.metadata.project_tag = inputPayload.project_tag;
    prdDocument.metadata.start_date = inputPayload.start_date;
    prdDocument.metadata.end_date = inputPayload.end_date;
    if (inputPayload.team_members && inputPayload.team_members.length > 0) {
      prdDocument.metadata.developers = inputPayload.team_members.map((name, i) => ({
        name,
        role: inputPayload.team_member_roles?.[i] ?? '',
      }));
    }
    if (inputPayload.stakeholders) {
      prdDocument.metadata.stakeholder_names = inputPayload.stakeholders
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    }

    // Force changelog to exactly 1 entry with correct data
    prdDocument.sections.changelog = [
      {
        version: 1,
        date: inputPayload.start_date || new Date().toISOString().slice(0, 10),
        author: ownerName,
        summary: 'Initial draft',
      },
    ];

    // Generate Tiptap content
    const tiptapContent = prdToTiptap(prdDocument);

    // Compute health score
    const healthResult = computeHealthScore(prdDocument);

    // Count words
    const wordCount = countDocumentWords(prdDocument);

    // Update PRD + version + ai_run in parallel (all independent)
    const durationMs = Date.now() - startMs;

    const [prdUpdate, , aiRunUpdate] = await Promise.all([
      supabase
        .from('prds')
        .update({
          content: prdDocument,
          tiptap_content: tiptapContent,
          health_score: healthResult.score,
          health_breakdown: healthResult.breakdown,
          word_count: wordCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prdId),
      supabase.from('prd_versions').insert({
        prd_id: prdId,
        version_number: 1,
        content: tiptapContent,
        created_by: user.id,
        source: 'ai_generate',
        change_summary: 'Initial draft generated by DraftMind AI',
      }),
      supabase
        .from('ai_runs')
        .update({
          status: 'success',
          model_used: modelUsed,
          total_tokens: tokensUsed ?? 0,
          duration_ms: durationMs,
          output_payload: {
            health_score: healthResult.score,
            word_count: wordCount,
            section_count: 14,
          },
          completed_at: new Date().toISOString(),
        })
        .eq('id', aiRunId),
    ]);

    if (prdUpdate.error) {
      throw new Error(`Failed to update PRD: ${prdUpdate.error.message}`);
    }

    if (aiRunUpdate.error) {
      logError(
        'prd.generate',
        'Failed to update ai_run',
        { error: aiRunUpdate.error.message },
        user.id,
      );
    }

    // Activity log — use admin client (RLS blocks user insert on activity_log)
    await logActivity({
      workspaceId,
      actorId: user.id,
      type: 'prd_created',
      resourceType: 'prd',
      resourceId: prdId,
      metadata: {
        title: inputPayload.title,
        model: modelUsed,
        duration_ms: durationMs,
        health_score: healthResult.score,
      },
    });

    return NextResponse.json({
      ok: true,
      healthScore: healthResult.score,
      wordCount,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    logError('prd.generate', errMsg, { stack: error instanceof Error ? error.stack : undefined });
    if (activityContext.workspaceId && activityContext.userId && activityContext.prdId) {
      await logActivity({
        workspaceId: activityContext.workspaceId,
        actorId: activityContext.userId,
        type: 'ai_generation_failed',
        resourceType: 'prd',
        resourceId: activityContext.prdId,
        metadata: {
          title: activityContext.title ?? undefined,
          error: errMsg.slice(0, 500),
        },
      });
    }
    return NextResponse.json(
      { error: 'Something went wrong while generating your PRD. Please try again.' },
      { status: 500 },
    );
  }
}
