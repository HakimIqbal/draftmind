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
import { generateText } from 'ai';

// ---------------------------------------------------------------------------
// Convert AI output sections into a PRDDocument
// ---------------------------------------------------------------------------

function aiSectionsToPRDDocument(
  sections: AIGeneratedSections,
  userId: string,
  title: string,
): PRDDocument {
  const prd = createEmptyPRD(userId, title);

  // Overview (rich text)
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

  // Problem Statement (rich text)
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

  // Objectives
  prd.sections.objectives = sections.objectives.map((obj, i) => ({
    id: `OBJ-${String(i + 1).padStart(3, '0')}`,
    type: 'goal' as const,
    description: obj.statement,
    key_results: [obj.measurable_outcome],
  }));

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
  prd.sections.darci = {
    decider: parseDarciRole(sections.darci.decider),
    accountable: parseDarciRole(sections.darci.accountable),
    responsible: parseDarciRole(sections.darci.responsible),
    consulted: parseDarciRole(sections.darci.consulted),
    informed: parseDarciRole(sections.darci.informed),
  };

  // Scope
  prd.sections.scope = {
    in_scope: sections.scope.in_scope,
    out_of_scope: sections.scope.out_of_scope,
  };

  // User Stories
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
  prd.sections.functional_reqs = sections.functional_reqs.map((req, i) => ({
    id: `FR-${String(i + 1).padStart(3, '0')}`,
    priority: mapPriority(req.priority),
    title: req.title,
    description: req.description,
    dependencies: [],
  }));

  // NFR
  prd.sections.nfr = {
    performance: sections.nfr.performance ? [sections.nfr.performance] : [],
    security: sections.nfr.security ? [sections.nfr.security] : [],
    accessibility: sections.nfr.accessibility ? [sections.nfr.accessibility] : [],
    scalability: sections.nfr.scalability ? [sections.nfr.scalability] : [],
    reliability: [],
    compliance: [],
  };

  // Success Metrics
  prd.sections.success_metrics = sections.success_metrics.map((m, i) => ({
    id: `SM-${String(i + 1).padStart(3, '0')}`,
    name: m.name,
    definition: m.definition ?? '',
    baseline: m.baseline ?? '',
    target: m.target,
    measurement_window: m.measurement_window,
  }));

  // Timeline
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
  prd.sections.risks = sections.risks.map((r, i) => ({
    id: `RISK-${String(i + 1).padStart(3, '0')}`,
    description: r.description,
    likelihood: r.likelihood,
    impact: r.impact,
    mitigation: r.mitigation,
  }));

  // References
  prd.sections.references = sections.references.map((ref, i) => ({
    id: `REF-${String(i + 1).padStart(3, '0')}`,
    type: (ref.type as 'document' | 'url' | 'other') || 'other',
    url: ref.url,
    title: ref.title,
  }));

  // Glossary
  prd.sections.glossary = sections.glossary.map((g) => ({
    term: g.term,
    definition: g.definition,
  }));

  // Changelog
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

  try {
    const user = await requireUser();
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
    await supabase
      .from('ai_runs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', aiRunId);

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
      teamMembers: inputPayload.team_members?.join(', '),
      constraints: inputPayload.constraints,
      successCriteria: inputPayload.success_criteria,
      platform: inputPayload.platform,
      priority: inputPayload.priority,
      techStack: inputPayload.tech_stack,
      designLink: inputPayload.design_link,
    });

    // Try ALL providers in priority order with real fallback
    let aiSections: AIGeneratedSections = undefined!;
    let modelUsed = 'pending';
    let tokensUsed = 0;
    let providerId: string | null = null;
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
        providerId = provider.id;

        // Update status to running
        await supabase
          .from('ai_runs')
          .update({ status: 'running', model_used: `${provider.display_name}/${modelUsed}` })
          .eq('id', aiRunId);

        // Call AI
        const result = await generateText({
          model,
          system: SYSTEM_PROMPT,
          prompt: userPrompt,
          maxTokens: 16000,
          temperature: 0.5,
        });

        tokensUsed = result.usage?.totalTokens ?? 0;

        // Parse response
        let jsonText = result.text.trim();
        const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenceMatch) {
          jsonText = fenceMatch[1]!.trim();
        }

        const parsed = JSON.parse(jsonText);

        const validation = AIGeneratedSectionsSchema.safeParse(parsed);
        if (validation.success) {
          aiSections = validation.data;
        } else if (parsed.overview) {
          aiSections = parsed as AIGeneratedSections;
        } else {
          throw new Error(`AI output validation failed: ${validation.error.message}`);
        }

        // Update provider stats on success
        updateProviderStats(provider.id, true, Date.now() - startMs).catch(() => {});
        generationSucceeded = true;
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        providerErrors.push(`${provider.display_name}: ${msg}`);
        updateProviderStats(provider.id, false, Date.now() - startMs, msg).catch(() => {});
        continue; // Try next provider
      }
    }

    if (!generationSucceeded) {
      const allErrorsMsg = `All providers failed: ${providerErrors.join(' | ')}`;
      const durationMs = Date.now() - startMs;
      await supabase
        .from('ai_runs')
        .update({
          status: 'error',
          error_message: allErrorsMsg,
          duration_ms: durationMs,
        })
        .eq('id', aiRunId);

      return NextResponse.json({ error: allErrorsMsg }, { status: 500 });
    }

    // Convert to PRDDocument
    const prdDocument = aiSectionsToPRDDocument(aiSections, user.id, inputPayload.title);

    // Generate Tiptap content
    const tiptapContent = prdToTiptap(prdDocument);

    // Compute health score
    const healthResult = computeHealthScore(prdDocument);

    // Count words
    const wordCount = countDocumentWords(prdDocument);

    // Update PRD
    const { error: updateError } = await supabase
      .from('prds')
      .update({
        content: prdDocument,
        tiptap_content: tiptapContent,
        health_score: healthResult.score,
        health_breakdown: healthResult.breakdown,
        word_count: wordCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', prdId);

    if (updateError) {
      throw new Error(`Failed to update PRD: ${updateError.message}`);
    }

    // Create initial prd_version
    await supabase.from('prd_versions').insert({
      prd_id: prdId,
      version_number: 1,
      content: prdDocument,
      tiptap_content: tiptapContent,
      word_count: wordCount,
      health_score: healthResult.score,
      created_by: user.id,
      change_summary: 'Initial draft generated by DraftMind AI',
    });

    // Update ai_run to success
    const durationMs = Date.now() - startMs;
    const updateResult = await supabase
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
      .eq('id', aiRunId);

    if (updateResult.error) {
      console.error('Failed to update ai_run:', updateResult.error.message);
    }

    // Update provider stats
    if (providerId) {
      const { updateProviderStats } = await import('@/lib/ai/client');
      await updateProviderStats(providerId, true, durationMs).catch(() => {});
    }

    // Log activity
    await supabase.from('activity_log').insert({
      workspace_id: workspaceId,
      actor_id: user.id,
      type: 'prd_created',
      resource_type: 'prd',
      resource_id: prdId,
      metadata: {
        title: inputPayload.title,
        model: modelUsed,
        duration_ms: durationMs,
        health_score: healthResult.score,
      },
    });

    return NextResponse.json({
      ok: true,
      mock: false,
      healthScore: healthResult.score,
      wordCount,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generate] Error:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
