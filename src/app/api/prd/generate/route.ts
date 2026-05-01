import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/permissions';
import { getDefaultAIClient } from '@/lib/ai/client';
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
// Mock content generator (used when no AI provider is configured)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateMockPRDContent(title: string, brief: string): AIGeneratedSections {
  const today = new Date().toISOString().slice(0, 10);
  const briefSnippet = brief.slice(0, 120);

  return {
    overview: `${title} is a product initiative aimed at addressing key challenges identified by the team. ${briefSnippet}...\n\nThis PRD outlines the requirements, scope, and success criteria for delivering a solution that meets stakeholder expectations and drives measurable business outcomes. The document serves as the single source of truth for all teams involved in the execution of this project.`,

    problem_statement: `Current workflows are inefficient and lack the tooling needed to support the goals described in the brief: "${briefSnippet}..." Teams spend significant time on manual processes that could be automated, leading to slower delivery cycles and reduced team morale. There is no standardized approach to solving this problem today, resulting in inconsistent quality and duplicated effort across departments.`,

    objectives: [
      {
        statement: 'Reduce manual effort by 50% within 3 months of launch',
        measurable_outcome:
          'Time spent on manual tasks decreases from 10h/week to 5h/week per team member',
        priority: 'must_have',
      },
      {
        statement: 'Achieve 80% user adoption within the first quarter',
        measurable_outcome: 'Weekly active users reach 80% of total licensed users',
        priority: 'must_have',
      },
      {
        statement: 'Improve stakeholder satisfaction score to 4.2/5.0',
        measurable_outcome: 'Post-launch survey score averages 4.2 or higher',
        priority: 'should_have',
      },
      {
        statement: 'Enable self-service reporting for all team leads',
        measurable_outcome: 'At least 5 custom reports created by non-technical users per month',
        priority: 'nice_to_have',
      },
    ],

    darci: {
      decider: 'Product Lead',
      accountable: 'Project Owner',
      responsible: ['Engineering Team', 'Design Team', 'QA Team'],
      consulted: ['Customer Support', 'Sales Team'],
      informed: ['Executive Leadership', 'Marketing Team'],
    },

    scope: {
      in_scope: [
        'Core workflow automation features',
        'User dashboard with real-time metrics',
        'Role-based access control (RBAC)',
        'Integration with existing notification systems',
        'Mobile-responsive web interface',
      ],
      out_of_scope: [
        'Native mobile application (planned for Phase 2)',
        'Third-party marketplace integrations',
        'Legacy system migration tooling',
        'Multi-language UI localization beyond EN/ID',
      ],
    },

    user_stories: [
      {
        role: 'Product Manager',
        want: 'to generate a PRD from a brief automatically',
        benefit: 'I can focus on strategic decisions instead of document formatting',
        acceptance_criteria: [
          'PRD is generated within 60 seconds of submitting a brief',
          'All 14 standard sections are populated with relevant content',
          'Generated content can be edited inline after generation',
        ],
      },
      {
        role: 'Engineering Lead',
        want: 'to review functional requirements with clear acceptance criteria',
        benefit: 'my team can estimate and plan sprints accurately',
        acceptance_criteria: [
          'Each functional requirement has a priority level assigned',
          'Requirements are grouped logically by feature area',
        ],
      },
      {
        role: 'Stakeholder',
        want: 'to track project health at a glance',
        benefit: 'I can make informed go/no-go decisions quickly',
        acceptance_criteria: [
          'Health score is visible on the PRD overview page',
          'Score breakdown shows completeness, specificity, and consistency metrics',
        ],
      },
      {
        role: 'QA Engineer',
        want: 'to see user stories with acceptance criteria',
        benefit: 'I can create test cases that map directly to requirements',
        acceptance_criteria: [
          'Each user story has at least 2 acceptance criteria',
          'Acceptance criteria are written in testable format',
        ],
      },
    ],

    functional_reqs: [
      {
        priority: 'must_have',
        title: 'Brief Input Form',
        description:
          'Users can enter a project brief via a structured form with title, description, timeline, and stakeholder fields.',
      },
      {
        priority: 'must_have',
        title: 'AI-Powered Generation',
        description:
          'System generates a complete PRD from the brief using an AI language model, populating all 14 sections.',
      },
      {
        priority: 'must_have',
        title: 'Inline Editor',
        description:
          'Generated PRD content is editable via a rich text editor with section-based navigation.',
      },
      {
        priority: 'should_have',
        title: 'Health Score Dashboard',
        description:
          'Real-time health score calculation showing completeness, specificity, structural quality, and consistency.',
      },
      {
        priority: 'should_have',
        title: 'Version History',
        description:
          'Each save creates a new version. Users can view and compare previous versions.',
      },
      {
        priority: 'nice_to_have',
        title: 'Export to PDF/Markdown',
        description:
          'Users can export the PRD in PDF or Markdown format for sharing with external stakeholders.',
      },
    ],

    nfr: {
      performance:
        'Page load time under 2 seconds for PRD editor. AI generation completes within 90 seconds.',
      security:
        'All API keys encrypted at rest. Row-level security enforced via Supabase RLS policies.',
      accessibility:
        'WCAG 2.1 AA compliance. Keyboard navigable editor. Screen reader support for all major sections.',
      scalability:
        'System supports up to 1000 concurrent users and 10,000 PRDs per workspace without degradation.',
    },

    success_metrics: [
      {
        name: 'Generation Success Rate',
        baseline: '0%',
        target: '95%',
        measurement_window: 'First 30 days post-launch',
      },
      {
        name: 'Average Generation Time',
        baseline: 'N/A (manual process)',
        target: 'Under 60 seconds',
        measurement_window: 'Weekly average',
      },
      {
        name: 'User Adoption Rate',
        baseline: '0%',
        target: '80% of workspace members',
        measurement_window: 'First quarter',
      },
      {
        name: 'PRD Health Score Average',
        baseline: 'N/A',
        target: '75/100',
        measurement_window: 'Monthly average across all PRDs',
      },
    ],

    timeline: [
      {
        title: 'Foundation & Auth',
        date: today,
        deliverable: 'Project setup, authentication, workspace management, and database schema.',
      },
      {
        title: 'Generate & Editor MVP',
        date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        deliverable: 'AI generation pipeline, inline editor, and PRD viewing.',
      },
      {
        title: 'Review & Polish',
        date: new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10),
        deliverable: 'AI review, health score, export, and UI polish.',
      },
    ],

    risks: [
      {
        description: 'AI provider rate limits may cause generation failures during peak usage',
        likelihood: 'medium',
        impact: 'high',
        mitigation:
          'Implement retry logic with exponential backoff and fallback to mock generation.',
      },
      {
        description: 'Generated content quality may not meet user expectations',
        likelihood: 'medium',
        impact: 'medium',
        mitigation:
          'Allow inline editing of all generated content. Iterate on prompts based on user feedback.',
      },
      {
        description: 'Scope creep from stakeholder feature requests during development',
        likelihood: 'high',
        impact: 'medium',
        mitigation:
          'Strict phase-based delivery with clear scope boundaries. Defer non-essential features to backlog.',
      },
    ],

    references: [
      {
        type: 'document',
        url: 'https://example.com/prd-template',
        title: 'Internal PRD Template Guide',
      },
    ],

    glossary: [
      {
        term: 'PRD',
        definition:
          'Product Requirements Document — a structured specification of what a product should do and why.',
      },
      {
        term: 'DARCI',
        definition:
          'Decision-making framework: Decider, Accountable, Responsible, Consulted, Informed.',
      },
      {
        term: 'NFR',
        definition:
          'Non-Functional Requirement — quality attributes like performance, security, and scalability.',
      },
      {
        term: 'Health Score',
        definition:
          'A 0-100 metric measuring PRD completeness, specificity, structural quality, and consistency.',
      },
    ],

    changelog: [
      {
        version: 1,
        date: today,
        author: 'DraftMind AI',
        summary: 'Initial draft generated from brief (mock content for development).',
      },
    ],
  };
}

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

  // DARCI
  prd.sections.darci = {
    decider: sections.darci.decider ? [sections.darci.decider] : [],
    accountable: sections.darci.accountable ? [sections.darci.accountable] : [],
    responsible: sections.darci.responsible,
    consulted: sections.darci.consulted,
    informed: sections.darci.informed,
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
    priority: 'should' as const,
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
    baseline: m.baseline ?? '',
    target: m.target,
    measurement_window: m.measurement_window,
  }));

  // Timeline
  prd.sections.timeline = sections.timeline.map((ms, i) => ({
    id: `MS-${String(i + 1).padStart(3, '0')}`,
    title: ms.title,
    date: ms.date,
    deliverables: [ms.deliverable],
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
    };

    // Try to get AI provider
    let aiSections: AIGeneratedSections;
    let modelUsed = 'pending';
    let tokensUsed = 0;
    let providerId: string | null = null;

    try {
      const aiClient = await getDefaultAIClient(workspaceId);
      modelUsed = aiClient.modelId;
      providerId = aiClient.provider.id;

      // Update status to running
      await supabase
        .from('ai_runs')
        .update({ status: 'running', model_used: modelUsed })
        .eq('id', aiRunId);

      // Build prompt
      const userPrompt = buildGeneratePRDPrompt({
        brief: inputPayload.brief,
        title: inputPayload.title,
        ownerName: user.user_metadata?.full_name || user.email || 'User',
        stakeholderNames: [],
      });

      // Call AI
      const result = await generateText({
        model: aiClient.model,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        maxTokens: 8000,
        temperature: 0.7,
      });

      tokensUsed = result.usage?.totalTokens ?? 0;

      // Parse response — try to extract JSON from the text
      let jsonText = result.text.trim();

      // Strip markdown code fences if present
      const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        jsonText = fenceMatch[1]!.trim();
      }

      const parsed = JSON.parse(jsonText);

      // Validate with Zod (lenient)
      const validation = AIGeneratedSectionsSchema.safeParse(parsed);
      if (validation.success) {
        aiSections = validation.data;
      } else {
        // Use raw parsed data if it has at least the overview field
        if (parsed.overview) {
          aiSections = parsed as AIGeneratedSections;
        } else {
          throw new Error(`AI output validation failed: ${validation.error.message}`);
        }
      }
    } catch (providerError) {
      // No mock fallback — return real error
      const providerErrMsg =
        providerError instanceof Error ? providerError.message : String(providerError);
      const durationMs = Date.now() - startMs;
      await supabase
        .from('ai_runs')
        .update({
          status: 'error',
          error_message: providerErrMsg,
          duration_ms: durationMs,
        })
        .eq('id', aiRunId);

      // Update provider stats on failure
      if (providerId) {
        const { updateProviderStats } = await import('@/lib/ai/client');
        await updateProviderStats(providerId, false, durationMs, providerErrMsg).catch(() => {});
      }

      return NextResponse.json({ error: providerErrMsg }, { status: 500 });
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
      change_summary: false
        ? 'Initial draft generated (mock content — no AI provider configured)'
        : 'Initial draft generated by DraftMind AI',
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
