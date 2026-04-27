# Phase 2 — Auth & Dashboard

> **Prerequisite**: `00_MASTER_BRIEF.md` + `01_PHASE1_FOUNDATION.md` complete. Base UI components, layout shell, Supabase auth, RLS, Tweaks panel — semua ready.

> **Estimated effort**: 1.5 weeks solo, ~6 hours/day.

> **Output**: A001-A009 fully functional. User dapat login (Google + magic link), complete onboarding 4 step, lihat 3 dashboard view (home/list/pipeline) dengan data real dari Supabase, switch workspace.

---

## Goals

After this phase completes:

1. A001 Login fully implemented sesuai design spec v2.1 (light mode, hero illustration, dual auth path)
2. A002-A005 Onboarding wizard 4 step, data tersimpan ke `profiles` + `workspaces` + `workspace_members` + `providers` (jika user setup di step 4)
3. A006 Dashboard Home Feed dengan greeting dynamic, quick input untuk start PRD, stat cards real (counts dari DB), Continue working (last 4 PRDs), Activity feed, Needs your attention
4. A007 Dashboard List Table dengan all PRDs in workspace, filter by status, search, sort
5. A008 Dashboard Pipeline kanban read-only grouped by status (4 column: Draft / Reviewed / Refined / Final)
6. A009 Empty State untuk workspace tanpa PRD
7. A023 Workspace Switcher popover berfungsi
8. Sample seed data 5-8 PRD per workspace untuk demo
9. Real-time refresh: bikin PRD di tab A → tab B auto-update via Supabase Realtime

---

## Task Breakdown

### Task 2.1 — A001 Login Page

**Spec reference**: `draftmind_imagine_prompt_v2.1.md` section A001.

**Theme**: LIGHT MODE exception (bg cream #FAF7F2). Override `data-theme="light"` di route layout `(auth)/layout.tsx`.

**Layout**: Editorial split — left brand panel + right form panel.

**Steps**:

1. Create `src/app/(auth)/login/page.tsx`:
   - Server component, redirect ke `/home` jika sudah authenticated
   - Render `<LoginPageClient />` untuk interactive parts

2. Create `src/components/auth/login-page-client.tsx`:
   - **Left panel** (50% width):
     - bg cream #FAF7F2
     - Tier 1 logo (halftone brain) ~280px center
     - Hero serif Fraunces "Think Less. / Draft Smarter." (display 56-64px, line-height 1.05)
     - Subhead Inter Tight "AI-powered Product Requirement Documents for modern teams" ink-secondary
     - Testimonial card cream-on-cream subtle:
       ```
       "DraftMind cut our PRD time by 60% — and the structure is consistent across the team."
       Maya R., Senior PM at Northloop
       ```
       Avatar gradient initial 32px
     - Footer kiri: badge mono "Used by 1,200+ PMs · 4.9/5 G2 · SOC 2"
   - **Right panel** (50% width):
     - bg-surface white
     - Tier 2 logo + wordmark di top
     - Title "Welcome back" Inter Tight 24px
     - Subhead "Sign in to continue to your workspace" ink-secondary
     - **Primary**: button "Continue with Google" — fill ember (THIS is the rare full-fill ember instance allowed). Icon Google logo SVG monochrome left.
     - Divider hairline "or with email"
     - Email input + "Send magic link" button outline ember (NOT filled)
     - Disabled "Continue with SSO (Enterprise only)" dengan tooltip mono info icon
     - Bottom: "© 2026 DraftMind · Privacy · Terms · Status" mono 11px

3. Implement OAuth flow:

   ```typescript
   const handleGoogleSignIn = async () => {
     const supabase = createBrowserClient();
     await supabase.auth.signInWithOAuth({
       provider: 'google',
       options: {
         redirectTo: `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/onboarding/step-1`,
       },
     });
   };
   ```

4. Implement magic link:

   ```typescript
   const handleMagicLink = async (email: string) => {
     const supabase = createBrowserClient();
     const { error } = await supabase.auth.signInWithOtp({
       email,
       options: {
         emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/onboarding/step-1`,
       },
     });
     if (error) toast.error(error.message);
     else toast.success('Magic link sent! Check your email.');
   };
   ```

5. Update `src/app/api/auth/callback/route.ts` — handle `next` query param:

   ```typescript
   const next = searchParams.get('next') ?? '/home';
   // Check if profile.onboarding_completed_at is null → redirect to /onboarding/step-1
   // Else redirect to next (default /home)
   ```

6. Loading state: `<Skeleton>` while OAuth initiating, button disabled state, ember spinner replaced with Lucide `Loader2` ink-secondary.

**Acceptance**:

- Visit `/login` → light mode editorial layout match spec
- Click Google → redirect to Google → callback → if first time, redirect to `/onboarding/step-1`; if returning, redirect to `/home`
- Email magic link sends real email (Supabase Auth → Logs di local, real SMTP di production)
- Tweaks override: kalau user sudah set `theme: 'dark'` di sebelumnya, login page tetap light (route-level override).

---

### Task 2.2 — A002-A005 Onboarding Wizard 4 Step

**Spec reference**: v2.1 sections A002, A003, A004, A005.

**Layout**: Wizard centered card, dark mode strict.

**Shared elements**:

- Top: 5-dots step indicator (filled ember active, hollow border-default sisanya)
- Subtitle mono 11px "Step N of 4" ink-tertiary
- Headline serif Fraunces (1 instance per page) — display 32-40px
- Footer: "Skip for now" text-link (where applicable) + "Continue" outline ember

**Steps**:

1. Create `src/components/onboarding/onboarding-shell.tsx`:
   - Receives `currentStep: 1 | 2 | 3 | 4 | 5`, renders step indicator + children + footer
   - Centered card max-width 560px

2. Create `src/app/(auth)/onboarding/step-1/page.tsx` (A002):
   - Headline "Tell us about you"
   - Question "What's your role?" + Select dropdown options:
     `Product Manager`, `Business Analyst`, `Project Manager`, `Technical Lead`, `Engineering Manager`, `Designer`, `Other`
   - Question "How experienced are you with PRD writing?" + 3 RadioCard horizontal:
     - "Beginner" — "I've read PRDs but rarely write them"
     - "Intermediate" — "I write PRDs occasionally for my projects"
     - "Expert" — "Writing PRDs is core to my workflow"
   - Server Action `updateOnboardingStep1(formData)` → save ke `profiles.role_self_reported` + `profiles.experience_level`
   - On submit success → router.push('/onboarding/step-2')

3. Create `src/app/(auth)/onboarding/step-2/page.tsx` (A003):
   - Headline "Where do you work?"
   - Input "Company name" placeholder "Algo Network"
   - Select "Team size": `Just me`, `2-10`, `11-50`, `51-200`, `200+`
   - Multi-select chip "Primary use cases": Feature PRD, RFC, Experiment Brief, One-pager, Research brief, Custom
   - Optional Select "Industry"
   - Server Action saves ke `profiles.primary_use_cases` + temporary state untuk step 3 workspace creation

4. Create `src/app/(auth)/onboarding/step-3/page.tsx` (A004):
   - Headline "Create your workspace."
   - Input "Workspace name" (default suggestion dari step 2 company name)
   - Input "Workspace URL slug" — auto-derived dari name via slug() util, editable, live preview "draftmind.app/w/[slug]" mono
   - Section "Workspace icon" — 4 RadioCard mono geometric (circle/square/rounded/hexagon) accent ember tipis
   - Toggle "Make workspace private (invite-only)" default ON
   - Server Action createWorkspace:
     ```typescript
     const { data: workspace } = await supabase.from('workspaces').insert({...}).select().single();
     await supabase.from('workspace_members').insert({ workspace_id: workspace.id, user_id: user.id, role: 'admin' });
     ```

5. Create `src/app/(auth)/onboarding/step-4/page.tsx` (A005 — compound):
   - **Top half**: "Configure your AI provider"
     - Grid 6 RadioCard providers (Anthropic, OpenAI, Gemini, Groq, Sumopod, GaNRouter)
     - Each card: mono provider icon (`<AnthropicIcon />`, etc — implement di `src/components/icons/provider/`)
     - "Skip for now" link bawah grid → finish onboarding tanpa provider
     - Selected provider → expand inline form: API key input password masked, "Test API key" button → call POST /api/providers/test
   - **Bottom half**: "Invite your team"
     - Email multi-input (chip-based, comma/enter separated)
     - Role dropdown per email
     - "Skip" link
   - Footer: "Back" + "Finish setup" outline ember
   - Server Action finalizeOnboarding:
     ```typescript
     // Save provider if configured
     // Send invitations if any
     // Set profiles.onboarding_completed_at = now()
     // Redirect to /home
     ```

6. Implement `/api/providers/test` POST route:
   ```typescript
   // Body: { type: ProviderType, apiKey: string, baseUrl?: string, model?: string }
   // Try simple "Hello, respond with 'pong'" prompt to validate
   // Return { ok: boolean, model: string, message: string, latency_ms: number }
   ```

**Acceptance**:

- 4 step wizard navigable forward + backward (preserve form state via URL search params or zustand)
- Refresh browser di step 3 → form data preserved
- Skip provider works, skip team invite works
- Onboarding complete → `profiles.onboarding_completed_at` set, redirect to `/home`
- Re-login after onboarding → goes direct to `/home` (skip onboarding)

---

### Task 2.3 — A006 Dashboard Home Feed

**Spec reference**: v2.1 section A006. **Paling kompleks dari semua dashboard view.**

**Steps**:

1. Update `src/app/(app)/home/page.tsx` (Server Component):

   ```typescript
   export default async function HomePage() {
     const supabase = await createServerClient();
     const { data: { user } } = await supabase.auth.getUser();
     const profile = await getProfileById(user.id);
     const workspace = await getCurrentWorkspace(user.id);
     const stats = await getDashboardStats(workspace.id);
     const continueWorking = await getContinueWorkingPRDs(workspace.id, user.id, 4);
     const activityFeed = await getActivityFeed(workspace.id, 6);
     const needsAttention = await getNeedsAttention(workspace.id, user.id);

     return <HomeFeedClient
       profile={profile}
       workspace={workspace}
       stats={stats}
       continueWorking={continueWorking}
       activityFeed={activityFeed}
       needsAttention={needsAttention}
     />;
   }
   ```

2. Create query functions di `src/lib/db/queries/dashboard.ts`:
   - `getDashboardStats(workspaceId)` → `{ activePRDs, queueCount, avgHealth, cycleTime, deltas: { ... } }`
   - `getContinueWorkingPRDs(workspaceId, userId, limit)` → 4 most recent PRDs user-related
   - `getActivityFeed(workspaceId, limit)` → recent activity_log entries with actor profile join
   - `getNeedsAttention(workspaceId, userId)` → Notifications where recipient_id = user, type in ('review_request', 'approval_needed', 'mention'), unread

3. Create `src/components/dashboard/home-feed.tsx` (client wrapper untuk interactivity):
   - **Greeting**: dynamic by hour ("Good morning/afternoon/evening, {firstName}") + sparkle ✦ sigil
   - **Quick input card** (`<HomeQuickInput />`):
     - Label mono "START WITH AI"
     - Title input besar dengan placeholder rotating: "Reduce cart abandonment by 15% with inline address validation and saved payment tokens…"
     - Action row buttons: Attach (paperclip), Dictate (mic), `Draft PRD` (filled ember primary), separator, From Loom transcript, Paste user interview, Start from OKR, Use Feature PRD template (text-link)
     - On submit: navigate `/prds/new?brief=<encoded>`
   - **Stats row** 4 cards (`<StatCard />`):
     - Active PRDs / In your queue / Avg health / Cycle time
     - Each: number Inter Tight 28px, sparkline thin SVG line ember 1.5px, delta mono "+3 this week"
   - **Continue working**:
     - Section header "Continue working" + "View all →" link to /prds
     - 4 cards horizontal scroll, each: mono document glyph + title + project tag chip + StatusPill + avatar stack 2-3 + "2h ago" mono
   - **Activity feed** (right column on desktop, below on tablet):
     - List items format: "[avatar] [name] [verb] [PRD link] · [timestamp mono]"
     - Verbs: commented on, approved, drafted, blocked, requested review on, exported, viewed
   - **Needs your attention** (3 cards horizontal):
     - Each: mono icon (eye for review, speech bubble for comment, check for approval) + title + PRD link + status pill "Open"

4. Implement Supabase Realtime subscription:
   ```typescript
   useEffect(() => {
     const channel = supabase
       .channel('dashboard-updates')
       .on(
         'postgres_changes',
         { event: '*', schema: 'public', table: 'prds', filter: `workspace_id=eq.${workspace.id}` },
         () => {
           router.refresh();
         },
       )
       .subscribe();
     return () => {
       supabase.removeChannel(channel);
     };
   }, [workspace.id]);
   ```

**Acceptance**:

- `/home` renders semua section dengan data real dari Supabase
- Click PRD card di Continue working → navigate ke `/prds/[prdId]`
- Click "View all" → navigate ke `/prds` (A007)
- Submit quick input → navigate ke `/prds/new` dengan brief preserved
- Buka tab kedua, create PRD via API → tab pertama auto-refresh

---

### Task 2.4 — A007 Dashboard List Table

**Spec reference**: v2.1 section A007.

**Steps**:

1. Update `src/app/(app)/prds/page.tsx`:
   - Server component dengan search params: `status`, `q`, `sort`, `page`
   - Use `nuqs` untuk URL state management
   - Pre-fetch first page of PRDs via `getPRDsByWorkspace(workspaceId, filters, pagination)`

2. Create `src/lib/db/queries/prd.ts`:

   ```typescript
   export async function getPRDsByWorkspace(
     workspaceId: string,
     filters: PRDFilters,
     pagination: Pagination,
   ) {
     // Drizzle query with workspace_id filter, status filter, fulltext search di title, sort by updated_at default
     // Join workspace_members untuk owner avatar
     // Return { items, total, hasMore }
   }
   ```

3. Create `src/components/dashboard/prd-list-table.tsx`:
   - Title "My PRDs · [count] documents"
   - Filter row: chips text-only (All / Drafts / Reviewed / Refined / Final / Archived) — All active = ember underline
   - Search input dengan icon mono right
   - Sort dropdown text-link "Updated ↓"
   - Table compact 44px rows:
     - Header mono uppercase 11px ink-tertiary: NAME / STATUS / OWNER / HEALTH / TEAM / UPDATED
     - Hairline `border-subtle` separator antar row
     - NAME col: mono document glyph + title bold + project tag mono ink-tertiary di baris 2
     - STATUS col: `<StatusPill />`
     - OWNER col: avatar 24px + name
     - HEALTH col: badge mono "● 86" dengan dot color score-based
     - TEAM col: avatar stack 2-3 24px overlap
     - UPDATED col: relative time mono ink-tertiary
   - Hover row: bg sedikit lighter, kebab "..." muncul di kolom paling kanan
   - Empty result state: "No PRDs match your filter."
   - Pagination: load more button atau infinite scroll

4. Optional: virtualize rows kalau > 50 PRDs (pakai TanStack Virtual). Ini optional Phase 2, mandatory Phase 4.

**Acceptance**:

- Filter chips switch active state, results update without page reload (nuqs URL state)
- Search debounced 300ms, hits Postgres fulltext via `to_tsvector('english', title)`
- Sort dropdown changes order
- Click row → navigate `/prds/[prdId]`
- Empty state shows when no results

---

### Task 2.5 — A008 Dashboard Pipeline

**Spec reference**: v2.1 section A008.

**Steps**:

1. Update `src/app/(app)/prds/pipeline/page.tsx`:
   - Server component
   - Fetch PRDs grouped by status: Draft, In review/Reviewed, Refined, Final
   - Pass to `<PRDPipelineBoard />`

2. Create `src/components/dashboard/prd-pipeline-board.tsx`:
   - Title "Pipeline" + helper mono ink-tertiary "Read-only view by status. Move PRDs by editing them."
   - Top right: Filter button + "+ New PRD"
   - 4 columns:
     - Header mono uppercase 11px: "● [STATUS NAME] [count]"
     - Dot color sesuai Tenet 3 (Draft=ink-tertiary, In review=amber-muted, Refined=ember, Final=sage-muted)
     - **NO column-bg-tinted** — header transparent, just text + dot
   - Column body: stack vertical PRD cards bg-surface compact 180-220px wide
     - Each card: mono document glyph + title 14px bold + project tag mono + footer (avatar stack 2 + relative time) + health badge "● 86" mono top-right
   - Page bg-canvas, no tinted columns

**Acceptance**:

- 4 columns render dengan dot+label header sesuai Tenet 3
- PRD cards render dengan SAME mono document glyph (no emoji, no per-project icon)
- Column count badge accurate
- Click PRD card → navigate `/prds/[prdId]`

---

### Task 2.6 — A009 Empty State

**Spec reference**: v2.1 section A009.

**Steps**:

1. Update logic di `src/app/(app)/prds/page.tsx`:
   - Kalau workspace.totalPRDs === 0 (workspace fresh) → render `<EmptyState />` instead of table
   - Kalau ada PRD tapi filter no match → render generic "No PRDs match your filter" (already done in Task 2.4)

2. Create `src/components/dashboard/empty-state.tsx`:
   - Centered area
   - SVG illustration mono line-art (sketch dokumen + cursor + ember accent dot kecil)
     - Implement custom SVG inline di `src/components/icons/empty-illustration.tsx`
     - Mono stroke 1.5px ink-secondary, optional 1 ember accent (max 5% area)
   - Headline serif Fraunces "Your first PRD is a paste away" (1 instance)
   - Subhead: "Drop in meeting notes, a Jira epic, or just a rough idea. AI turns it into a structured, reviewable spec your team can ship from."
   - 3 cards horizontal compact:
     - "Draft from brief" — mono icon FileText + title + 1-line desc
     - "Start from template" — mono icon LayoutTemplate + title + "12 patterns"
     - "Import existing doc" — mono icon Upload + title + "Notion, Confluence, Google Docs"
   - Bottom link "Watch 90-second demo →" ink-secondary (link to nothing for now, FYP scope)

**Acceptance**:

- New workspace fresh signup → lihat empty state di `/prds`
- Click "Draft from brief" → navigate `/prds/new`
- Click "Start from template" → navigate `/templates`
- Click "Import existing doc" → modal "Import (Coming soon in Phase 4)" placeholder

---

### Task 2.7 — A023 Workspace Switcher Popover

**Spec reference**: v2.1 section A023.

**Steps**:

1. Create `src/components/layout/workspace-switcher.tsx`:
   - Trigger: button di sidebar top, render current workspace icon + name + chevron-down
   - Popover content (Radix Popover) max-width 320px bg-elevated:
     - Header mono uppercase 11px ink-tertiary "YOUR WORKSPACES"
     - List workspaces: avatar geometric 24px + name + "[N] members" mono + checkmark mono untuk current
     - Hover: bg sedikit lighter
     - Click → switch workspace via Server Action setCurrentWorkspace
     - Hairline divider
     - Header "INVITED" + 1-2 pending invitations (kalau ada) dengan "Accept" outline + "Decline" text-link buttons kecil
     - Footer: "+ Create workspace" outline + "Manage workspaces" text-link

2. Create Server Action setCurrentWorkspace:

   ```typescript
   'use server';
   export async function setCurrentWorkspace(workspaceId: string) {
     // Verify user is member
     // Set cookie 'current_workspace_id' atau update profiles.last_active_workspace_id
     // revalidatePath('/');
   }
   ```

3. Update `getCurrentWorkspace(userId)` query → read from cookie/profile, fallback ke first workspace user member.

**Acceptance**:

- Click workspace switcher di sidebar → popover opens
- Click another workspace → page refresh dengan workspace context baru, semua data dashboard update
- Invitation accept/decline works
- "+ Create workspace" → modal create workspace (skeleton, real impl Phase 4)

---

### Task 2.8 — Seed Data

**Goal**: Realistic sample data untuk demo & testing.

**Steps**:

1. Create `scripts/seed.ts`:

   ```typescript
   import { createAdminClient } from '@/lib/supabase/admin';

   async function seed() {
     const supabase = createAdminClient();

     // Create test users via auth.signUp (Maya Reyes, Rizky Pratama, Sari Wijaya, Daniel Oh)
     const users = await Promise.all([
       supabase.auth.admin.createUser({
         email: 'maya@algonetwork.id',
         password: 'demo1234',
         email_confirm: true,
         user_metadata: { full_name: 'Maya Reyes' },
       }),
       // ... etc
     ]);

     // Create 2 workspaces (Algo Network · Product, Algo Network · Growth)
     // Add all 4 users as members dengan role mix
     // Create 8 sample PRDs sesuai topics dari Master Brief Section 1:
     //   - Wallet redesign Q2 — KYC tier-2 untuk pengguna Indonesia (Maya, in_review, health 86)
     //   - Onboarding Revamp — Indonesia 3G optimization (Rizky, draft, health 54)
     //   - Real-time Collaboration v2 (Daniel, refined, health 92)
     //   - ... etc
     // Create comments, versions, AI runs untuk realism
   }
   ```

2. Sample PRD content harus mix EN + ID per Master Brief
3. Create `pnpm db:seed` script

**Acceptance**:

- After `pnpm db:reset && pnpm db:migrate && pnpm db:seed`, login as `maya@algonetwork.id / demo1234`
- See 8 sample PRDs di `/prds`, 4 di Continue working `/home`, distribution di Pipeline 4 columns

---

### Task 2.9 — Tests

**Goal**: E2E tests untuk auth + dashboard, integration tests untuk queries.

**Steps**:

1. E2E `tests/e2e/auth.spec.ts`:
   - Visit `/login` → click magic link with test email → simulate clicking link → land on `/onboarding/step-1`
   - Complete 4 step → land on `/home`
   - Sign out → redirect to `/login`

2. E2E `tests/e2e/dashboard.spec.ts`:
   - Login as seeded user → `/home` shows greeting + stats
   - Click "View all" → `/prds` shows table
   - Filter by "Drafts" → only draft PRDs
   - Search "wallet" → filter results
   - Click row → navigate to `/prds/[id]` (page exists from Phase 1, content Phase 3)

3. Integration `tests/integration/queries.test.ts`:
   - getPRDsByWorkspace: cross-workspace isolation (RLS test)
   - getDashboardStats: count accuracy
   - getActivityFeed: ordering by created_at desc

**Acceptance**: `pnpm test && pnpm e2e` all pass.

---

## Definition of Done — Phase 2

- [ ] All 9 tasks acceptance passed
- [ ] User flow end-to-end: signup → onboarding 4 step → home → list → pipeline → workspace switch
- [ ] Sample seed data login works (Maya, Rizky, Sari, Daniel)
- [ ] All design Tenet 1-10 enforced (visual review by user)
- [ ] Realtime updates work (PRD created in tab A appears in tab B)
- [ ] Tweaks switching applies across all dashboard pages real-time
- [ ] No emoji UI, no filled status pill, no saturated bg colors
- [ ] `pnpm check && pnpm e2e` green
- [ ] Vercel preview deploy passes

---

## Anti-Patterns Watch

Same as Phase 1 + extra:

- ❌ Filled status pill ("In review" pill bg orange) — must be transparent dot+label
- ❌ Emoji as PRD project icon (🛒🌐⚡💰) — must be mono document glyph
- ❌ Pipeline column with tinted background — must be transparent header only
- ❌ Stats card sparkline filled (must be thin line ember 1.5px, NOT area-filled)
- ❌ Onboarding "Continue" button filled ember (must be outline ember unless A001 Google CTA)
- ❌ Greeting hardcoded "Good afternoon" — must be dynamic by hour

---

## Handoff to Phase 3

After Phase 2 done, Phase 3 will implement A010-A020: Generate flow, Tiptap editor, AI features, refine, AI Review, version history. Phase paling kompleks. Make sure Phase 2 acceptance checklist 100% before lanjut.

---

**END OF PHASE 2 PROMPT**
