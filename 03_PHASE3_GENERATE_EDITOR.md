# Phase 3 — Generate, Editor & AI Features

> **Prerequisite**: Phase 1 + Phase 2 complete. Auth, dashboard, and 8 sample PRDs in seed data ready.

> **Estimated effort**: 3 weeks solo, ~6-8 hours/day. **Most complex phase.** Hero feature of DraftMind.

> **Output**: A010-A020 fully functional. User dapat input brief → AI generate full PRD streaming → review/edit di Tiptap editor dengan slash menu, AI suggestions inline, comments, refine modal, AI review page, version history.

---

## Goals

After this phase:

1. A010 Generate Form — user input project metadata + brief, click "Generate PRD" → real AI call streaming
2. A011 Generation Loading — INLINE skeleton + step list (NOT modal centered besar)
3. A012 Editor Default — Tiptap editor full-featured, kedua side panel terbuka (Outline kiri, AI Copilot kanan), collapsible
4. A013 Editor AI Assist Panel — selection-based AI actions (Rewrite/Expand/Summarize/Shorter/More formal/Fix grammar)
5. A014 Editor Comments Drawer — threaded comments, @mentions, reactions
6. A015 Editor Slash Menu — `/` triggers floating menu (Heading/List/Table/Embed/etc)
7. A016 Editor Markdown View + Panels Collapsed — toggle Markdown source, kedua panel jadi icon rail 44px
8. A017 Refine Section Modal — refine specific section dengan AI
9. A018 Regenerate Full PRD Modal — destructive action, creates v4 from v3
10. A019 AI Review Page — health score breakdown + findings list
11. A020 Version History — timeline left + diff view right

---

## Task Breakdown

### Task 3.1 — PRD JSON Schema & Validators

**Goal**: 14-section schema dengan Zod validation + parser/converter ke Tiptap.

**Steps**:

1. Create `src/lib/prd/schema.ts` lengkap dari Master Brief Section 6:

   ```typescript
   import { z } from 'zod';

   const TiptapContentSchema = z.object({
     type: z.literal('doc'),
     content: z.array(z.any()), // Tiptap JSON nodes
   });

   const PRDRichTextSchema = z.object({
     content: TiptapContentSchema,
     word_count: z.number(),
     ai_generated: z.boolean(),
     last_edited_by: z.string().uuid().optional(),
     last_edited_at: z.string().datetime().optional(),
   });

   const PRDObjectiveSchema = z.object({
     id: z.string(),
     statement: z.string(),
     measurable_outcome: z.string(),
     priority: z.enum(['must_have', 'should_have', 'nice_to_have']),
   });

   const PRDDarciMatrixSchema = z.object({
     decider: z.string().uuid().optional(),
     accountable: z.string().uuid().optional(),
     responsible: z.array(z.string().uuid()),
     consulted: z.array(z.string().uuid()),
     informed: z.array(z.string().uuid()),
   });

   const PRDUserStorySchema = z.object({
     id: z.string(),
     role: z.string(),
     want: z.string(),
     benefit: z.string(),
     acceptance_criteria: z.array(z.string()),
     priority: z.enum(['p0', 'p1', 'p2', 'p3']),
   });

   const PRDRequirementSchema = z.object({
     id: z.string(),
     priority: z.enum(['p0', 'p1', 'p2', 'p3']),
     title: z.string(),
     description: z.string(),
     dependencies: z.array(z.string()),
     status: z.enum(['proposed', 'approved', 'in_progress', 'done', 'deferred']).optional(),
   });

   const PRDNFRSchema = z.object({
     performance: z.string().optional(),
     security: z.string().optional(),
     accessibility: z.string().optional(),
     scalability: z.string().optional(),
     reliability: z.string().optional(),
     observability: z.string().optional(),
     compliance: z.string().optional(),
   });

   const PRDMetricSchema = z.object({
     id: z.string(),
     name: z.string(),
     baseline: z.string().optional(),
     target: z.string(),
     measurement_window: z.string(),
     data_source: z.string().optional(),
   });

   const PRDMilestoneSchema = z.object({
     id: z.string(),
     title: z.string(),
     date: z.string().datetime(),
     deliverable: z.string(),
     owner_id: z.string().uuid().optional(),
   });

   const PRDRiskSchema = z.object({
     id: z.string(),
     description: z.string(),
     likelihood: z.enum(['low', 'medium', 'high']),
     impact: z.enum(['low', 'medium', 'high']),
     mitigation: z.string(),
     owner_id: z.string().uuid().optional(),
   });

   const PRDReferenceSchema = z.object({
     type: z.enum(['url', 'jira', 'figma', 'loom', 'notion', 'doc']),
     url: z.string().url(),
     title: z.string(),
     description: z.string().optional(),
   });

   export const PRDDocumentSchema = z.object({
     version: z.literal(1),
     metadata: z.object({
       title: z.string(),
       project_tag: z.string().optional(),
       owner_id: z.string().uuid(),
       stakeholders: z.array(z.string().uuid()),
       start_date: z.string().datetime().optional(),
       end_date: z.string().datetime().optional(),
       template_id: z.string().uuid().optional(),
       locale: z.enum(['en', 'id', 'mixed']),
     }),
     sections: z.object({
       overview: PRDRichTextSchema,
       problem_statement: PRDRichTextSchema,
       objectives: z.array(PRDObjectiveSchema),
       darci: PRDDarciMatrixSchema,
       scope: z.object({ in_scope: z.array(z.string()), out_of_scope: z.array(z.string()) }),
       user_stories: z.array(PRDUserStorySchema),
       functional_reqs: z.array(PRDRequirementSchema),
       nfr: PRDNFRSchema,
       success_metrics: z.array(PRDMetricSchema),
       timeline: z.array(PRDMilestoneSchema),
       risks: z.array(PRDRiskSchema),
       references: z.array(PRDReferenceSchema),
       glossary: z.array(z.object({ term: z.string(), definition: z.string() })),
       changelog: z.array(
         z.object({
           version: z.number(),
           date: z.string().datetime(),
           author: z.string(),
           summary: z.string(),
         }),
       ),
     }),
   });

   export type PRDDocument = z.infer<typeof PRDDocumentSchema>;
   ```

2. Create `src/lib/prd/tiptap-content.ts` — converter PRD JSON ↔ Tiptap doc:
   - `prdToTiptap(prd: PRDDocument): TiptapContent` — render sections sequentially as headings + content
   - `tiptapToPRD(content: TiptapContent, existing: PRDDocument): PRDDocument` — parse back, preserve structured arrays (objectives, user stories) using custom Tiptap nodes

3. Create `src/lib/prd/health-score.ts`:

   ```typescript
   export function computeHealthScore(prd: PRDDocument): {
     score: number;
     breakdown: HealthBreakdown;
   } {
     const completeness = computeCompleteness(prd); // % of required fields filled
     const specificity = computeSpecificity(prd); // density of metrics/numbers/concrete language
     const structural = computeStructural(prd); // proper hierarchy, no orphan sections
     const consistency = computeConsistency(prd); // no contradicting statements (heuristic)
     const score = Math.round((completeness + specificity + structural + consistency) / 4);
     return { score, breakdown: { completeness, specificity, structural, consistency } };
   }
   ```

4. Create `src/lib/prd/markdown.ts` — PRD ↔ Markdown for export

5. Create custom Tiptap extensions di `src/lib/editor/extensions/`:
   - `objective-node.ts` — custom node type 'prd_objective'
   - `user-story-node.ts` — custom node 'prd_user_story'
   - `requirement-node.ts` — custom node 'prd_requirement'
   - `risk-node.ts` — custom node 'prd_risk'
   - `metric-node.ts` — custom node 'prd_metric'
   - `ai-suggestion-mark.ts` — inline mark untuk AI-suggested text (renders dengan ember underline)

**Acceptance**:

- `PRDDocumentSchema.parse(seedPRD)` succeeds untuk semua 8 sample PRD
- `prdToTiptap` round-trip via `tiptapToPRD` preserves data
- `computeHealthScore` returns 0-100 dengan breakdown 4 dimensions
- Custom nodes render correctly di Tiptap editor preview

---

### Task 3.2 — AI Provider Abstraction Layer

**Goal**: Vercel AI SDK abstraction supporting 6 providers dengan unified interface.

**Steps**:

1. Create `src/lib/ai/providers.ts`:

   ```typescript
   import { anthropic } from '@ai-sdk/anthropic';
   import { openai } from '@ai-sdk/openai';
   import { google } from '@ai-sdk/google';
   import { groq } from '@ai-sdk/groq';
   import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

   export const PROVIDER_REGISTRY = {
     anthropic: {
       displayName: 'Anthropic',
       defaultModel: 'claude-sonnet-4-6',
       availableModels: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
       create: (apiKey: string) => anthropic({ apiKey }),
       supportsStructuredOutput: true,
       supportsStreaming: true,
     },
     openai: {
       displayName: 'OpenAI',
       defaultModel: 'gpt-4o',
       availableModels: ['gpt-4o', 'gpt-4o-mini', 'o1-preview'],
       create: (apiKey: string) => openai({ apiKey }),
       supportsStructuredOutput: true,
       supportsStreaming: true,
     },
     gemini: {
       displayName: 'Google Gemini',
       defaultModel: 'gemini-1.5-pro',
       availableModels: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
       create: (apiKey: string) => google({ apiKey }),
       supportsStructuredOutput: true,
       supportsStreaming: true,
     },
     groq: {
       displayName: 'Groq',
       defaultModel: 'llama-3.3-70b-versatile',
       availableModels: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
       create: (apiKey: string) => groq({ apiKey }),
       supportsStructuredOutput: false, // limited
       supportsStreaming: true,
     },
     sumopod: {
       displayName: 'Sumopod',
       defaultModel: 'sumopod-xl-v2',
       availableModels: ['sumopod-xl-v2', 'sumopod-base'],
       create: (apiKey: string, baseUrl: string) =>
         createOpenAICompatible({ apiKey, baseURL: baseUrl, name: 'sumopod' }),
       supportsStructuredOutput: false,
       supportsStreaming: true,
     },
     ganrouter: {
       displayName: 'GaNRouter',
       defaultModel: 'gan-route-v1',
       availableModels: ['gan-route-v1'],
       create: (apiKey: string, baseUrl: string) =>
         createOpenAICompatible({ apiKey, baseURL: baseUrl, name: 'ganrouter' }),
       supportsStructuredOutput: false,
       supportsStreaming: true,
     },
   } as const;

   export type ProviderType = keyof typeof PROVIDER_REGISTRY;
   ```

2. Create `src/lib/ai/client.ts`:

   ```typescript
   import { decryptApiKey } from '@/lib/crypto';

   export async function createAIClient(providerId: string) {
     const supabase = await createServerClient();
     const { data: provider } = await supabase
       .from('providers')
       .select('*')
       .eq('id', providerId)
       .single();

     if (!provider || provider.status !== 'active') {
       throw new Error('Provider not available');
     }

     const apiKey = decryptApiKey(provider.api_key_encrypted);
     const config = PROVIDER_REGISTRY[provider.type as ProviderType];

     return {
       provider,
       client: provider.base_url ? config.create(apiKey, provider.base_url) : config.create(apiKey),
       model: provider.default_model,
     };
   }
   ```

3. Create `src/lib/crypto.ts` — AES-256-GCM encryption untuk API keys:

   ```typescript
   import 'server-only';
   import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
   import { env } from '@/env';

   const KEY = Buffer.from(env.ENCRYPTION_KEY, 'base64');
   const ALGO = 'aes-256-gcm';

   export function encryptApiKey(plaintext: string): string {
     const iv = randomBytes(12);
     const cipher = createCipheriv(ALGO, KEY, iv);
     const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
     const tag = cipher.getAuthTag();
     return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.');
   }

   export function decryptApiKey(encrypted: string): string {
     const [ivB64, tagB64, encB64] = encrypted.split('.');
     const iv = Buffer.from(ivB64, 'base64');
     const tag = Buffer.from(tagB64, 'base64');
     const enc = Buffer.from(encB64, 'base64');
     const decipher = createDecipheriv(ALGO, KEY, iv);
     decipher.setAuthTag(tag);
     return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
   }
   ```

4. Create `src/lib/ai/streaming.ts` helper untuk SSE streaming response

**Acceptance**:

- All 6 providers can be tested via `/api/providers/test` endpoint
- API keys stored encrypted, decrypted server-only
- Switching provider via Settings A024 berhasil call AI dengan provider baru

---

### Task 3.3 — AI Prompts Library

**Goal**: System prompts + structured output schemas untuk semua AI features.

**Steps**:

1. Create `src/lib/ai/prompts/system.ts`:

   ```typescript
   export const SYSTEM_PROMPT = `You are DraftMind, an AI assistant specialized in writing Product Requirement Documents (PRDs) for B2B internal product teams in Indonesia.
   
   Your approach:
   - Structured: every PRD follows the 14-section schema strictly.
   - Specific: prefer concrete numbers, dates, and metrics over vague language.
   - Bilingual: UI labels are English, but content can mix English and Bahasa Indonesia naturally based on the user's input.
   - Honest: if information is missing, acknowledge it explicitly. Don't fabricate stakeholder names or specific metrics that weren't provided.
   - Concise: prefer clarity over verbosity. Cut filler words.
   
   You write for product managers, business analysts, project managers, and technical leads who will use the PRD to align teams, get approvals, and ship features.`;
   ```

2. Create `src/lib/ai/prompts/generate-prd.ts`:

   ```typescript
   import { z } from 'zod';

   export function buildGeneratePRDPrompt(brief: string, metadata: PRDMetadataInput) {
     return `Generate a complete Product Requirement Document based on this brief:
   
   <brief>
   ${brief}
   </brief>
   
   <metadata>
   Project: ${metadata.title}
   Owner: ${metadata.ownerName}
   Stakeholders: ${metadata.stakeholderNames.join(', ') || 'Not specified'}
   Timeline: ${metadata.startDate ?? 'TBD'} to ${metadata.endDate ?? 'TBD'}
   Template: ${metadata.templateName ?? 'Feature PRD (default)'}
   </metadata>
   
   Output a structured PRD with all 14 sections filled. For sections where the brief lacks information, write thoughtful placeholder content marked as [TO CONFIRM] rather than fabricating specifics.
   
   Use Bahasa Indonesia naturally in content where relevant (the brief includes Indonesian context). Keep section headings in English.`;
   }

   export const PRDGenerationOutputSchema = z.object({
     // Same shape as PRDDocumentSchema but without metadata.owner_id (filled server-side)
     // Plus health_estimation: { completeness, specificity, structural, consistency }
   });
   ```

3. Create `src/lib/ai/prompts/refine-section.ts`:

   ```typescript
   export function buildRefineSectionPrompt(
     section: keyof PRDDocument['sections'],
     currentContent: any,
     instruction: string,
   ) {
     return `You are refining the "${section}" section of a PRD.
   
   Current content:
   <current>
   ${JSON.stringify(currentContent, null, 2)}
   </current>
   
   User instruction:
   <instruction>
   ${instruction}
   </instruction>
   
   Output ONLY the new content for this section, in the same JSON shape as the current content. Do not modify other sections.`;
   }
   ```

4. Create `src/lib/ai/prompts/ai-review.ts`:

   ```typescript
   export const AIReviewOutputSchema = z.object({
     health_score: z.number().min(0).max(100),
     breakdown: z.object({
       completeness: z.number(),
       specificity: z.number(),
       structural: z.number(),
       consistency: z.number(),
     }),
     summary: z.string(),
     findings: z.array(
       z.object({
         severity: z.enum(['high', 'medium', 'low']),
         section_key: z.string(),
         title: z.string(),
         description: z.string(),
         suggested_fix: z.string().optional(),
       }),
     ),
   });

   export function buildAIReviewPrompt(prd: PRDDocument) {
     return `Review this PRD for completeness, clarity, and acceptance criteria quality.
   
   <prd>
   ${JSON.stringify(prd, null, 2)}
   </prd>
   
   Identify findings categorized by severity:
   - HIGH: missing required content, conflicting statements, unmeasurable metrics
   - MEDIUM: vague language, weak acceptance criteria, missing dependencies
   - LOW: style issues, formatting inconsistencies, minor clarity improvements
   
   For each finding, provide a specific suggested_fix when possible. Output structured.`;
   }
   ```

5. Create `src/lib/ai/prompts/inline-suggest.ts` — selection-based actions

**Acceptance**: Each prompt builder returns valid string + Zod schema parse-able from sample LLM responses.

---

### Task 3.4 — A010 Generate Form

**Spec**: v2.1 section A010.

**Steps**:

1. Create `src/app/(app)/prds/new/page.tsx`:
   - Server component, prefetch templates list
   - Receive optional `?brief=` query param dari home quick input
   - Render `<GenerateForm />` client component

2. Create `src/components/generate/generate-form.tsx`:
   - Top breadcrumb "My PRDs / New PRD" mono ink-tertiary
   - Title "Create new PRD" Inter Tight 22px
   - Tab navigation underline-style: From scratch (active) / From transcript / From template
   - **Section 1 card "Project metadata"**:
     - Project name input
     - Document owner dropdown (default current user + avatar prefix)
     - Stakeholders multi-select chips
     - Start date + End date pickers (use Radix or custom, NOT colorful calendar)
     - Document stage badge Tenet 3 ("● Draft" default)
     - Template dropdown (Feature PRD / Experiment Brief / RFC / One-pager / Custom)
   - **Section 2 card "Brief / context"**:
     - Label "Tell us about what we're building"
     - Textarea besar 8-10 rows
     - Mono placeholder
     - Helper mono: "Tip: minimum 200 words for best results · Currently: {wordCount} words"
   - **Sticky footer thin 56px**:
     - Estimasi credits "~25 credits" mono ink-tertiary kiri
     - "Cancel" text-link + "Generate PRD" button ember filled (primary CTA — allowed full-fill)

3. React Hook Form + Zod validation
4. On submit:
   - Validate brief min 50 words (warning if < 200)
   - Insert ke `prds` dengan status='draft' + content empty placeholder
   - Insert ke `ai_runs` dengan type='generate_prd' status='queued'
   - Navigate ke `/prds/[id]?generate=true` → triggers Generation Loading state

**Acceptance**:

- Form renders dengan compact density
- Word count live update di textarea
- Submit dengan brief < 50 words → toast warning, allow override
- Submit valid → navigate ke editor in loading state
- Cancel → confirm dialog kalau form dirty, else navigate back

---

### Task 3.5 — A011 Generation Loading (INLINE)

**Spec**: v2.1 section A011 — **INLINE, NOT MODAL**. Critical anti-drift point.

**Steps**:

1. Update `src/app/(app)/prds/[prdId]/page.tsx`:
   - Read PRD from DB
   - Kalau status='draft' AND content empty AND has active ai_run type='generate_prd' → render `<GenerationLoading />`
   - Kalau ada content → render `<EditorPage />` (Task 3.6+)

2. Create `src/components/generate/generation-loading.tsx`:
   - **Sidebar tetap visible & interactive** (gak di-blur)
   - **Main area**: skeleton preview struktur PRD (judul placeholder, section heading placeholder dengan shimmer halus)
   - **Top bar slim main area**: progress bar 2px ember tipis di atas ink 6% bg + percentage mono ink-secondary kecil "62% · ~6 sec remaining"
   - **Side strip kanan kecil 280px** (di tempat AI Copilot panel akan muncul nanti):
     - Header mono uppercase "GENERATION STEPS"
     - List mono format:
       ```
       ✓  Building structured prompt    (sage dot kecil)
       ✓  Calling [Provider Name]       (sage)
       ⋯  Parsing JSON output           (current — ember pulse halus)
       ○  Validating 14 sections        (pending — ink-tertiary hollow)
       ○  Saving as draft
       ```
   - **Bottom right**: "Cancel" text-link ink-secondary

3. Wire up streaming via SSE:

   ```typescript
   // src/components/generate/use-generation-stream.ts
   export function useGenerationStream(aiRunId: string) {
     const [step, setStep] = useState(0);
     const [percentage, setPercentage] = useState(0);
     const [error, setError] = useState<string | null>(null);

     useEffect(() => {
       const eventSource = new EventSource(`/api/prd/generate/stream?runId=${aiRunId}`);
       eventSource.onmessage = (e) => {
         const data = JSON.parse(e.data);
         if (data.type === 'progress') {
           setStep(data.step);
           setPercentage(data.percentage);
         }
         if (data.type === 'complete') {
           eventSource.close();
           router.refresh();
         }
         if (data.type === 'error') {
           setError(data.message);
           eventSource.close();
         }
       };
       return () => eventSource.close();
     }, [aiRunId]);

     return { step, percentage, error };
   }
   ```

4. Implement `/api/prd/generate/route.ts` POST:
   - Validate input
   - Insert ai_run row
   - Trigger background async work (atau use Vercel Edge / Inngest, tapi untuk Phase 3 cukup async with streaming)
   - Return ai_run_id

5. Implement `/api/prd/generate/stream/route.ts`:
   - Server-Sent Events
   - Step 1: build prompt (publish progress: 'Building structured prompt', %=10)
   - Step 2: call AI client streamObject (publish 'Calling [Provider]', %=30, then stream %=60)
   - Step 3: parse JSON (publish %=70)
   - Step 4: validate against PRDDocumentSchema (publish %=85)
   - Step 5: update prds row dengan content + content_tiptap (publish %=100)
   - Send final 'complete' event

6. Cancel logic: button click → DELETE /api/ai-runs/[id] → cancel ai_run, soft-delete prd row dengan status='draft' empty.

**Acceptance**:

- Generate from form → navigate ke `/prds/[id]?generate=true` → GenerationLoading renders
- Sidebar tetap interactive (klik "Home" tetap bisa navigate)
- Progress bar tipis 2px ember updates real-time
- Step list updates dengan dot color states
- After generation complete → page auto-refresh → editor renders dengan content
- Cancel works
- Error case (API key invalid, network fail) → display error message inline, allow retry

---

### Task 3.6 — A012 Editor Default

**Spec**: v2.1 section A012. **Hero feature.**

**Steps**:

1. Create `src/components/editor/tiptap-editor.tsx`:
   - useEditor with extensions:
     - StarterKit (heading, paragraph, list, blockquote, horizontalRule, code, codeBlock)
     - Link
     - Placeholder
     - Mention (untuk @mention di content/comments)
     - TaskList + TaskItem
     - Table
     - Custom: ObjectiveNode, UserStoryNode, RequirementNode, RiskNode, MetricNode, AISuggestionMark
     - Collaboration (Yjs setup, single-user mode untuk Phase 3)
   - Editor content from `prds.tiptap_content` JSONB
   - Auto-save debounced 800ms via Server Action
   - Custom CSS via `src/styles/editor.css`:
     - Headings: serif Fraunces ONLY untuk H1 PRD title (1 instance), Inter Tight bold untuk H2-H4
     - Bold dalam body: ink-primary darker, NOT ember
     - Code inline: bg-elevated mono small
     - Code block: bg-rail mono dengan syntax highlight subtle
     - Blockquote: border-left 2px ember-deep + italic ink-secondary

2. Create `src/components/editor/editor-shell.tsx`:
   - Layout 3+ column dengan sidebar 240px persistent (already from layout)
   - **Panel side-left 280px (Outline / Comments / Info tabs)**:
     - Tabs underline-style, "Outline" default active
     - Outline tab: list section dengan dot mono kecil sebelah label (color berdasarkan section health: sage/amber/red-muted muted)
     - Active item: ember underline kiri 2px
     - Bottom: card mono "DRAFT STATS" — Words / Read time / Readability / Completeness
     - Header right: chevron-left 16px (collapse handle)
   - **Main editor area center, max-width 760px**:
     - Top meta row:
       - StatusPill Tenet 3
       - Version mono "v3"
       - Project chip text-only
       - Avatar stack 4 members
       - Button "Version" outline mono ink-secondary (link → /prds/[id]/version-history)
       - Button "Share" outline ember underline accent (opens share dialog Phase 4)
       - Kebab menu (Archive, Duplicate, Delete)
     - PRD title H1 Fraunces serif (1 instance) editable contenteditable
     - Sub-meta: avatar + "last edit 2h ago · 5 min read"
     - Health Score visual: ring mono compact 64px diameter dengan number Inter Tight bold + "/100" mono di tengah, label "Good shape" mono ink-secondary di bawah ring + 4 sub-meter bars horizontal kanan ring
     - Tab navigation dokumen (Overview / Problem / Goals / DARCI / User Stories / Metrics / T...) underline-style
     - Body content: Tiptap editor render
     - AI suggestion callout inline (sample): card bg-elevated subtle border-default 1px, prefix mono "✦ AI suggestion ([Provider] · 0.4s) —" lalu suggestion text. Action row: "Accept" outline ember kecil, "Regenerate" outline ink-secondary, "Dismiss" text-link
     - Bottom strip thin 36px footer: dot sage "Saved 4 min ago · v3" + "1,284 words" + "5 min read" + "Readability: Good" + "82% complete" + "Toggle Markdown view" — mono ink-tertiary terpisah pipe |
   - **Panel side-right 360px (AI Copilot)**:
     - Header: "✦ AI Copilot" Inter Tight bold + meta "[Provider] · PRD mode" mono ink-tertiary. Top-right: chevron-right 16px (collapse handle), close X kecil.
     - Body: AI message bubble bg-surface, user message bubble bg-elevated align right
     - Action row: "Apply all" outline ember, "Pick one" outline ink-secondary
     - System status mono ink-tertiary "Pulling linked Jira tickets" + 3-dot pulse mono
     - Bottom: input area "Ask or command... (⌘J)" + chip suggestions row "/improve writing", "/summarize", "/generate metrics", "/find gaps" — mono outline pills

3. Create `src/components/editor/outline-panel.tsx`:
   - Tabs Outline / Comments / Info
   - Outline content: list semua section dari PRD content, klik scroll ke section di main editor
   - Comments tab: lazy load `<CommentsPanel />` from Task 3.8
   - Info tab: PRD metadata read-only (created_at, updated_at, owner, template, etc)

4. Create `src/components/editor/ai-copilot-panel.tsx`:
   - Initial state: "Ask anything about this PRD" + suggested prompts chips
   - Conversation history per PRD (store in localStorage atau new table `prd_chats` Phase 4)
   - Input dengan slash commands menu
   - Streaming response render
   - Apply suggestion actions

5. Create `src/components/editor/health-score-display.tsx`:
   - SVG ring 64px diameter, ember stroke 2px completed portion, ink 8% bg ring
   - Center: number bold + "/100" mono
   - Below: label "Good shape" mono — color-graded ('Excellent' >90, 'Good shape' 75-90, 'Needs work' <75)
   - Right side: 4 sub-bars horizontal 60px wide, 2px tipis ember di atas ink 6% bg, mono label

6. Wire up:
   - Tiptap editor onUpdate → debounced save via Server Action
   - Server Action recompute health score on save
   - Realtime subscribe to comments table for real-time comment update

**Acceptance**:

- A012 renders sesuai spec — semua element visible
- Edit content → auto-save berhasil, lihat updated_at change
- Click section di Outline panel → scroll ke section di editor
- Tab dokumen switching works (filter Tiptap render per section)
- AI Copilot input echoes back placeholder responses (real AI Phase 3.10)
- Health score visual updates after edit + save

---

### Task 3.7 — A013 AI Assist Panel (Selection-Based)

**Spec**: v2.1 section A013.

**Steps**:

1. Detect selection di Tiptap editor:

   ```typescript
   editor.on('selectionUpdate', ({ editor }) => {
     const { from, to, empty } = editor.state.selection;
     if (!empty && to - from > 10) {
       setShowAssist(true);
       setSelectedText(editor.state.doc.textBetween(from, to));
     } else {
       setShowAssist(false);
     }
   });
   ```

2. Replace AI Copilot panel content dengan AI Assist mode saat selection active:
   - Header: "AI assist" + meta "Selection: '[truncated text]…'" mono ink-tertiary
   - Section "QUICK ACTIONS" mono uppercase:
     - 2x3 grid tombol outline (NOT filled): Rewrite, Expand, Summarize, Shorter, More formal, Fix grammar
     - Each tombol: icon mono prefix kecil 14px + label
   - Section "SUGGESTIONS" mono uppercase:
     - On click quick action → call `/api/prd/ai-suggest`
     - Render 3 stacked cards bg-elevated:
       - Card title mono ink-secondary "Rewrite — More concrete verbs"
       - Body text suggestion
       - 2 buttons "Insert" outline ember + "Copy" text-link
   - Bottom: meta mono "[provider/model] · {tokensUsed} / {creditsLimit} credits" ink-tertiary

3. Implement `/api/prd/ai-suggest/route.ts` POST:
   - Body: `{ prdId, action, selectedText, context: { sectionKey, surroundingText } }`
   - Build prompt dari `src/lib/ai/prompts/inline-suggest.ts`
   - Call AI client, return 3 variations
   - Return + log to ai_runs

4. Insert action: replace selection in editor dengan suggested text via `editor.commands.insertContentAt({from, to}, newText)`

**Acceptance**:

- Select text > 10 char di editor → right panel switch ke AI Assist mode
- Click "Rewrite" → 3 card suggestions render
- Click "Insert" → selection replaced dengan suggestion
- Click "Copy" → toast "Copied to clipboard"
- Deselect → panel switch back ke AI Copilot default mode

---

### Task 3.8 — A014 Comments Drawer

**Spec**: v2.1 section A014.

**Steps**:

1. Create `src/components/editor/comments-panel.tsx` (mounted di Outline panel tab "Comments"):
   - Header "Comments · [openCount] open"
   - Tab pills (Open active / Resolved / @Me) — text-only chips dengan ember underline active
   - List threaded comments cards:
     - Avatar 24px + name + timestamp mono
     - Content text dengan @mention chip ember underline
     - Reaction count "👍 2" — emoji DI SINI **boleh** karena ini reaction inside user-generated comment, bukan UI icon
     - "Reply" / "Resolve" text-link buttons
     - Threaded replies indented 24px with hairline left
   - Empty state: "No comments yet. Start a thread by selecting text in the editor."
   - Bottom: comment input area dengan rich text mini toolbar mono icons + @mention picker

2. Comment selection feature:
   - User select text di editor → toolbar floating muncul dengan "+" icon untuk comment
   - Click → modal/popover untuk add comment, save dengan `selection_range: { from, to, text }`
   - Comment muncul di drawer + highlight tipis di editor di range tersebut

3. @mention implementation:
   - Tiptap Mention extension dengan suggestions list (workspace members)
   - Saat user @mention → save user_id ke `comments.mentions[]`
   - Trigger notification ke mentioned user

4. Resolve flow:
   - Click "Resolve" → set `resolved_at = now()`, `resolved_by = currentUser`
   - Resolved comment moves to "Resolved" tab, dimmed style

5. Realtime: subscribe ke comments table for current PRD, auto-append new comments

**Acceptance**:

- Add comment from selection → appears in drawer + notification ke @mentioned users
- Reply works
- Resolve removes from Open tab
- Filter @Me works (user_id di mentions array)
- Realtime: tab A add comment → tab B sees it without refresh

---

### Task 3.9 — A015 Slash Menu

**Spec**: v2.1 section A015.

**Steps**:

1. Create custom Tiptap extension `src/lib/editor/extensions/slash-command.ts`:
   - Detect `/` di empty line atau after space
   - Render floating menu dengan suggestions

2. Create `src/components/editor/slash-menu.tsx`:
   - Popover bg-elevated, border-default 1px, shadow tipis (NOT heavy)
   - Section header mono uppercase 11px "INSERT" ink-tertiary:
     - Heading 1 (Lucide Heading1 icon mono) + label + kbd "⌘1"
     - Heading 2, Heading 3
     - Bullet list, Numbered list, Checklist
     - Divider, Table, Callout, Code block, Quote
   - Section "EMBED": Figma link, Loom link, External URL
   - Hover: bg sedikit lighter, NO ember bg fill
   - Menu width 280px, max-height 360px scroll
   - Keyboard nav: ↑↓ to navigate, Enter to select, Esc to close
   - Filter via fuzzy search saat user mengetik setelah `/`

3. Custom items untuk PRD-specific blocks:
   - "Insert objective" → adds ObjectiveNode dengan default empty fields
   - "Insert user story" → adds UserStoryNode
   - "Insert requirement" → RequirementNode
   - "Insert risk" → RiskNode
   - "Insert metric" → MetricNode

**Acceptance**:

- Type `/` di empty line → menu appears
- Type `/he` → filter to Heading items
- Click "Heading 2" → applies H2 style ke current line
- Esc → close menu, cursor stays in editor
- Insert PRD-specific blocks render dengan custom node UI

---

### Task 3.10 — A016 Markdown View + Panels Collapsed State

**Spec**: v2.1 section A016. **WAJIB demonstrate state KEDUA panel collapsed.**

**Steps**:

1. Add toggle button di editor footer "Toggle Markdown view"
   - Click → switch ke Markdown source view
   - Editor content rendered as monospace IBM Plex Mono dengan syntax highlighting subtle:
     - Heading hash `#` ember tipis
     - Bold `**` double asterisks ink-secondary
     - List dashes `-` ink-tertiary
     - Links underline ember
   - bg-surface
   - Edit mode: textarea editable, on blur convert back ke Tiptap dan save

2. Implement panel collapse state:
   - Tweaks parameter 7 `panelState: 'expanded' | 'collapsed'` (already in tweaks store)
   - Plus per-side state (independent collapse): `outlineCollapsed: boolean`, `copilotCollapsed: boolean` di editor-store
   - When collapsed:
     - Panel kiri → icon rail 44px bg-rail (sedikit lebih dark dari main)
     - 3 icons stacked vertical: outline glyph, comment glyph, info glyph
     - Tooltip on hover
     - Click icon → re-open ke tab itu
   - Same untuk panel kanan: icon rail 44px dengan ✦ AI chat icon, suggestions icon, history icon

3. Create `src/components/editor/panel-collapsed-rail.tsx`:

   ```tsx
   <div className="bg-rail flex w-11 flex-col items-center gap-md border-r border-subtle py-md">
     {tabs.map((tab) => (
       <Tooltip key={tab.id} content={tab.label} side="right">
         <button onClick={() => onExpand(tab.id)} className="hover:bg-elevated size-8 rounded-md">
           <tab.icon className="stroke-1.5 size-5 text-ink-secondary" />
         </button>
       </Tooltip>
     ))}
   </div>
   ```

4. Markdown ↔ Tiptap conversion via `marked` for parse, custom renderer for serialize.

**Acceptance**:

- Click "Toggle Markdown view" → editor switches to mono source view
- Edit Markdown → on blur, content valid → Tiptap rich view updated
- Collapse panel kiri via chevron → icon rail 44px appears
- Click icon di rail → panel expands to that tab
- Tweaks panel `panelState: 'collapsed'` → both panels collapsed default

---

### Task 3.11 — A017 Refine Section Modal

**Spec**: v2.1 section A017.

**Steps**:

1. Trigger: kebab menu di section heading di editor → "Refine this section"
2. Create `src/components/refine/refine-section-modal.tsx`:
   - Radix Dialog max-width 560px bg-elevated
   - Title "Refine: [SectionName]" Inter Tight 18px + close X mono 16px
   - Subtitle "Specify what you want to improve in this section." ink-secondary
   - Card preview current content: 3 lines text + ellipsis, bg-surface lebih dark, padding 12px
   - Textarea "What would you like to change?" mono placeholder
   - Helper mono "0 words · Tip: be specific"
   - Footer thin separator: estimasi mono "~6 credits" left, "Cancel" + "Refine" outline ember (NOT filled)

3. Submit:
   - Call `/api/prd/refine` POST
   - Show inline loading state in modal (NOT modal centered)
   - On complete: show diff preview "Old → New" + "Apply" / "Try again" / "Cancel"
   - Apply → update PRD section, snapshot version, log ai_run

**Acceptance**:

- Click "Refine this section" → modal opens dengan current section preview
- Submit refine instruction → AI returns suggestion
- Diff view shows changes
- Apply → editor updates, version snapshot created

---

### Task 3.12 — A018 Regenerate Full PRD Modal

**Spec**: v2.1 section A018.

**Steps**:

1. Trigger: kebab menu di editor header → "Regenerate full PRD"
2. Create `src/components/refine/regenerate-full-modal.tsx`:
   - Modal max-width 600px
   - Title "Regenerate full PRD" + warning icon mono ink-secondary (NOT bright)
   - Body warning: "This will create version [N+1] of this PRD. Current version [N] will remain accessible in history."
   - Diff preview placeholder: "Changes from v3: [will be calculated after generation]" italic ink-tertiary
   - Textarea "What's different this time? (optional)" placeholder
   - Footer: "~25 credits" mono left
   - "Cancel" text-link
   - "Regenerate v[N+1]" button — KARENA destructive — border red-muted + text red-muted (NOT filled red bright)

3. Submit:
   - Snapshot current PRD ke prd_versions
   - Trigger generation flow (Task 3.5 reuse)
   - Result: new content = v[N+1], increment current_version

**Acceptance**:

- Click "Regenerate full PRD" → modal warns about new version
- Submit → loading inline (similar to A011)
- Complete → editor shows new version, version history shows v[N] preserved

---

### Task 3.13 — A019 AI Review Page

**Spec**: v2.1 section A019.

**Steps**:

1. Create `src/app/(app)/prds/[prdId]/ai-review/page.tsx`:
   - Server component, fetch PRD + most recent ai_run type='ai_review' + findings
   - Render `<AIReviewPage />`

2. Create `src/components/refine/ai-review-page.tsx`:
   - Sidebar persistent (already from layout)
   - Breadcrumb mono "[PRD title] / AI Review"
   - Title "AI Review" Inter Tight 22px + subtitle "Checks completeness, clarity, and acceptance criteria. Uses 4 credits." ink-secondary
   - Action row right: "Rerun" outline ink-secondary + "Apply all fixes" outline ember
   - **Hero card bg-surface**:
     - PRD Health Score visual besar — ring mono 120px diameter, ember stroke 3px completed portion
     - Center "72 / 100 — Almost shippable" mono
     - Right side ring: 4 horizontal bar charts thin 2px ember tipis (Completeness 82%, Specificity 78%, Structural 71%, Consistency 60%)
   - **Findings list**:
     - Heading mono uppercase "FINDINGS · [count]" + filter chip row (All / High / Medium / Low)
     - Each finding card horizontal compact bg-surface:
       - Severity badge mono left: Tenet 3 ("● HIGH" red-muted, "● MED" amber-muted, "● LOW" ink-tertiary)
       - Section reference mono "§ Goals" / "§ FR-04" ink-tertiary
       - Issue title bold
       - Suggested fix preview: 2-line ellipsis ink-secondary
       - Action row right: "Auto-fix" outline ember + "Show in doc" text-link + "Dismiss" text-link

3. Auto-fix logic:
   - Click "Auto-fix" on finding → call `/api/prd/refine` dengan auto-built instruction dari finding.suggested_fix
   - Update PRD, mark finding as fixed (set `fix_applied_at`)

4. "Rerun" button:
   - Trigger new ai_run type='ai_review'
   - Loading state inline di hero card

**Acceptance**:

- Visit `/prds/[id]/ai-review` → page renders dengan health score visual + findings list
- Filter chips work
- Auto-fix per finding works
- Apply all fixes works
- Show in doc → navigate ke editor + scroll ke section + highlight

---

### Task 3.14 — A020 Version History

**Spec**: v2.1 section A020.

**Steps**:

1. Create `src/app/(app)/prds/[prdId]/version-history/page.tsx`:
   - Fetch all versions dari `prd_versions` ordered by version_number desc
   - Render `<VersionHistoryPage />`

2. Create `src/components/version/version-history-page.tsx`:
   - Title "Version history · [PRD title]"
   - Layout 2 column: kiri timeline list, kanan diff preview
   - **Kiri (`<VersionTimeline />`)**:
     - List versions: each item card compact
     - Version label bold "v3"
     - Timestamp mono
     - Author + avatar 24px
     - Change summary 1-line
     - Source badge (manual / ai_generation / ai_refine / restore)
     - Badge "current" untuk active version (Tenet 3 "● current" sage dot)
     - Selected/hover state subtle
   - **Kanan (`<VersionDiffView />`)**:
     - Top toolbar: "Compare with: [v2]" dropdown + "Restore this version" outline ink-secondary + "Branch from this version" outline ember
     - Diff preview split-view:
       - Removed: bg red-muted 8% + ink red-muted, inline strikethrough
       - Added: bg sage-muted 8% + ink sage-muted
       - Unchanged: ink-secondary
     - Section-by-section diff using `diff` npm library or custom JSON diff
   - Bottom kanan meta mono "[version] · [wordCount] words · [readTime] min read · Last edit [time] by [author]"

3. Restore action:
   - Click "Restore this version" → confirm dialog
   - Confirm → set current PRD content = this version's content, increment current_version
   - Log activity

4. Branch action (Phase 4 stub for now):
   - Click "Branch from this version" → modal "Coming in Phase 4" placeholder

**Acceptance**:

- Version timeline shows all versions with author, timestamp, source
- Click version → diff view updates
- Restore → confirm → PRD content reverted, new version snapshot created
- Diff colors muted (NOT bright red/green saturated)

---

## Definition of Done — Phase 3

- [ ] All 14 tasks acceptance passed
- [ ] User flow end-to-end:
  - [ ] Brief → Generate → Loading → Editor → AI suggestions → Comment → Refine → AI Review → Version
- [ ] All 6 AI providers can be configured and used
- [ ] Streaming generation works on Vercel + local
- [ ] Tiptap editor renders custom PRD blocks correctly
- [ ] Slash menu `/` works with keyboard nav
- [ ] Selection-based AI assist works
- [ ] Markdown view toggle works
- [ ] Both panels collapse/expand independently
- [ ] AI Review generates findings with severity classification
- [ ] Version history with diff render correctly
- [ ] Realtime collab: tab A edits → tab B sees update (Yjs configured but single-user OK for FYP)
- [ ] All design Tenet 1-10 enforced
- [ ] `pnpm check && pnpm e2e` green
- [ ] Vercel preview deploy passes

---

## Anti-Patterns Watch

Same as Phase 1+2 + extra:

- ❌ Modal centered besar untuk Generation Loading — must be INLINE skeleton
- ❌ Bright orange spinner saat loading — must be ember pulse subtle on dot indicator
- ❌ AI suggestion callout dengan thick ember border — must be subtle border-default 1px
- ❌ Health score ring filled circle — must be stroke-only completed portion
- ❌ Filled severity pill di AI Review (bright red) — must be Tenet 3 dot+text
- ❌ Diff colors saturated bright — must be muted 8% bg + muted ink
- ❌ Slash menu items dengan emoji — must be Lucide mono icons
- ❌ Forgetting to log ai_runs untuk every AI invocation
- ❌ Storing API keys plaintext di providers table

---

## Handoff to Phase 4

After Phase 3 done, Phase 4 implements remaining 11 artboards: Templates, Workspace Members, Settings/Providers, Add Provider Wizard, Export multi-format, Public Share, Activity Log, AI Run History, Notifications, Command Palette.

---

**END OF PHASE 3 PROMPT**
