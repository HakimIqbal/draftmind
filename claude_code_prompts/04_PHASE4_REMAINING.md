# Phase 4 — Remaining Features & Polish

> **Prerequisite**: Phase 1, 2, 3 complete. All A001-A020 functional.

> **Estimated effort**: 1.5 weeks solo, ~6 hours/day.

> **Output**: A021-A031 implemented. App fully functional 31/31 artboard. Production-ready deployment to Vercel + VPS guide finalized. Demo video script drafted.

---

## Goals

After this phase:

1. A021 Templates Library — 12 built-in + custom workspace templates
2. A022 Workspace Members — invite, role management, member table
3. A024 LLM Providers List — manage workspace providers
4. A025 Add Provider Wizard — 4-step modal
5. A026 Export Modal — PDF/DOCX/MD/HTML/Slack/Jira
6. A027 Public Share View — light mode editorial layout
7. A028 Activity Log — workspace audit trail
8. A029 AI Run History — provider usage tracking
9. A030 Notifications Inbox — dropdown panel from bell icon
10. A031 Command Palette ⌘K — global search + actions
11. Production deploy guide finalized (Vercel + VPS step-by-step)
12. Performance audit pass (Lighthouse > 90 on key pages)
13. Security audit pass (RLS, encryption, CSP headers)

---

## Task Breakdown

### Task 4.1 — A021 Templates Library

**Spec**: v2.1 section A021.

**Steps**:

1. Create `src/app/(app)/templates/page.tsx`:
   - Fetch built-in templates (where workspace_id IS NULL) + workspace custom templates
   - Render `<TemplatesLibrary />`

2. Seed 12 built-in templates di `0009_seed_templates.sql` migration:
   - Feature PRD (default)
   - Experiment Brief (A/B test)
   - RFC (Request for Comments — technical)
   - One-pager (executive summary)
   - Research brief (user research)
   - Design proposal
   - Marketing campaign brief
   - API specification
   - Migration plan
   - Incident postmortem
   - Quarterly OKR doc
   - Custom (blank)
     Each with realistic `structure` jsonb (modified PRDDocumentSchema with appropriate sections enabled/disabled).

3. Create `src/components/templates/templates-library.tsx`:
   - Title "Templates" + subtitle "Start faster with proven structures."
   - **Featured section**: 3 hero cards horizontal:
     - Mono line-art thumbnail (sketch outline kecil, NO emoji icon)
     - Title bold
     - "Used 248× this quarter" mono ink-tertiary
     - "Use template" outline ember
   - **All templates section**:
     - Filter chip row: All / Feature / Experiment / RFC / One-pager / Research / Custom — text-only chips dengan ember underline active
     - Grid 4-5 column compact cards:
       - mono document glyph + title + 2-line description + use count mono + "Use" outline button

4. Create `src/components/templates/template-card.tsx`:
   - bg-surface, border-subtle 1px, hover sedikit lighter
   - Click "Use template" → navigate `/prds/new?template=[id]`

5. "Save as template" feature di editor (Phase 4 add-on):
   - Kebab menu di editor → "Save as template"
   - Modal: name + description + visibility (workspace-only / personal)
   - Insert ke `prd_templates` dengan workspace_id

**Acceptance**:

- 12 built-in templates render
- Filter chips work
- Click "Use template" → generate form opens dengan template structure pre-loaded
- Save current PRD as template works (admin/editor only)

---

### Task 4.2 — A022 Workspace Members

**Spec**: v2.1 section A022.

**Steps**:

1. Create `src/app/(app)/workspace/members/page.tsx`:
   - Tab navigation top: Members / Permissions / Billing / Integrations / Audit (Members active)
   - Tabs underline-style (Tenet 2 active)
   - Render `<MembersTable />`

2. Create `src/components/workspace/members-table.tsx`:
   - Title "Members · [N]" + button right "+ Invite member" outline ember
   - Search input + filter chips (All / Admins / Editors / Viewers / Pending)
   - Table compact rows 44px:
     - Avatar 24px + name (clickable to profile, optional Phase 4)
     - Email mono
     - Role dropdown (Admin / Editor / Commenter / Viewer) — text-only dropdown, NOT colored badge. Disabled untuk current user atau workspace owner.
     - Last active mono "2h ago"
     - Action menu kebab (Change role, Remove from workspace)
   - Section "Pending invitations · [N]" di bawah:
     - Format same row tapi dengan badge Tenet 3 "● Pending" amber-muted
     - Actions: "Resend" + "Revoke"

3. Create `src/components/workspace/invite-modal.tsx`:
   - Click "+ Invite member" → modal max-width 480px
   - Email multi-input (chip-based, paste comma-separated)
   - Role dropdown for invitees (default Editor)
   - Optional message textarea
   - "Send invitations" outline ember

4. Server Actions:
   - `inviteMembers(emails, role, message)` → create rows di workspace_invitations + send email (Phase 4: log to console for FYP, real SMTP optional)
   - `changeRole(memberId, newRole)` → update workspace_members.role (admin only)
   - `removeMember(memberId)` → delete workspace_members row + cascading cleanup

5. Permission rules:
   - Only admin can invite/remove/change role
   - Cannot remove last admin
   - Cannot remove yourself if you're owner

**Acceptance**:

- Members table renders dengan role dropdown
- Invite flow: email → invitation row created → magic link email sent
- Change role works (admin only)
- Remove member works dengan confirmation
- Pending invitations visible, resend/revoke works

---

### Task 4.3 — A024 LLM Providers List

**Spec**: v2.1 section A024.

**Steps**:

1. Create `src/app/(app)/settings/providers/page.tsx`:
   - Settings tab nav: Profile / Preferences / Providers (active) / API keys / Notifications / Audit
   - Render `<ProvidersList />`

2. Create `src/components/settings/providers-list.tsx`:
   - Title "LLM Providers" + subtitle "Manage AI providers used across your workspace."
   - Right: "+ Add provider" outline ember
   - Stack of provider cards (6 total):
     - Cards untuk providers yang sudah configured render dengan data dari DB
     - Cards untuk providers belum configured render placeholder dengan CTA "Connect"
     - Each card:
       - Provider icon mono left (`<AnthropicIcon />`, etc — implement Lucide-style monochrome line glyph custom SVG)
       - Provider name bold + status pill Tenet 3 ("● Active" sage / "● Disconnected" ink-tertiary / "● Error" red-muted)
       - Badge "DEFAULT" mono outline kalau provider is_default
       - Meta mono: "Default model: [model-id] · Last used [time]"
       - Action right: "Test" outline ink-secondary + "Edit" + kebab (Set as default, Disconnect, Delete)

3. Provider icons di `src/components/icons/provider/`:
   - Implement custom SVG monochrome line glyph untuk each provider (Tenet 4)
   - NOT official colored brand logos
   - Examples:
     - Anthropic: stylized "A" mark with subtle line geometry
     - OpenAI: hexagonal nodes connected
     - Gemini: spark or diamond shape
     - Groq: lightning bolt mono
     - Sumopod: pod/capsule shape
     - GaNRouter: routing arrow shape
   - All 24×24 viewBox, stroke 1.5px ink-secondary

**Acceptance**:

- Provider list renders dengan 1 active default + 5 unconfigured (or based on user setup)
- Click "Test" → call /api/providers/test, show inline result mono "✓ Valid" sage atau "✗ Invalid: [reason]" red-muted
- Click "Set as default" → only one default per workspace (DB constraint)
- Click "Disconnect" → soft-disconnect (keep record, set status='disconnected'), keep API key for re-enable

---

### Task 4.4 — A025 Add Provider Wizard

**Spec**: v2.1 section A025. **2 sub-state required**: Step 1 (provider type select) + Step 3 (API key input).

**Steps**:

1. Create `src/components/settings/add-provider-wizard.tsx`:
   - Modal max-width 600px bg-elevated
   - Top step indicator mono: "1. Provider type · 2. Base URL · 3. API key · 4. Model"
   - Current step bold ember, others ink-tertiary
   - Footer: "Cancel" text-link left + "Continue" outline ember (disabled until valid)

2. **Step 1 — Provider type**:
   - Radio cards 6 providers grid 2x3:
     - Each card: provider icon mono + name + 1-line tagline
     - Selected = border ember 1px + bg sedikit lighter (NOT filled ember)
   - Continue → Step 2

3. **Step 2 — Base URL** (only for Sumopod, GaNRouter):
   - Skip step kalau provider Anthropic/OpenAI/Gemini/Groq (use default)
   - Input "Base URL" placeholder e.g., "https://api.sumopod.com/v1"
   - Helper text mono "Use the API endpoint provided by your account."

4. **Step 3 — API key**:
   - Input password masked "API Key" dengan eye toggle (Lucide Eye/EyeOff)
   - Helper text "Where to find your API key:" + link mono per-provider (URL ke docs)
   - Button "Test API key" outline ink-secondary
   - On click test:
     - Loading state inline (NOT modal)
     - Result mono message:
       - ✓ Valid sage dengan model name detected
       - ✗ Invalid red-muted dengan reason
   - Continue disabled sampai test pass

5. **Step 4 — Model selection**:
   - Dropdown "Default model" dengan list available_models dari registry
   - Optional: "Test sample generation" untuk verify with selected model
   - Optional toggle: "Set as workspace default"
   - Submit → encrypt API key, insert provider row, navigate back ke A024

6. Server Actions:
   - `testProviderConnection(type, apiKey, baseUrl?)` → returns `{ ok, modelDetected, latency }`
   - `addProvider(formData)` → encrypt + insert + revalidatePath

**Acceptance**:

- 4-step wizard navigable
- Step 2 skipped untuk Anthropic etc, shown for Sumopod/GaNRouter
- Test API key real call, returns valid/invalid result
- Step 4 dropdown populated dynamically
- Submit creates provider row dengan encrypted api_key

---

### Task 4.5 — A026 Export Modal

**Spec**: v2.1 section A026. **6 export formats**.

**Steps**:

1. Create `src/components/export/export-modal.tsx`:
   - Modal max-width 720px bg-elevated
   - Title "Export PRD: [title]" + close X
   - Layout 2 column inside modal:
     - **Kiri**: format picker — radio cards horizontal:
       - PDF (default selected)
       - DOCX
       - Markdown
       - HTML
       - Slack message
       - Jira issue
       - Each card: mono icon + label
     - **Kanan**: theme picker untuk PDF only:
       - 4 thumbnail kecil (Editorial / Plain / Branded / Print) dengan radio dot selection
   - Section "Sections to include" checkbox list:
     - All sections (default checked)
     - Granular per-section toggle
   - Section "Advanced options" collapsible:
     - Include comments
     - Include AI suggestions (resolved + open)
     - Watermark "DRAFT" / custom text
     - Page break per section (PDF only)
   - Footer: estimasi file size mono "~ 480 KB · 12 pages" left + "Cancel" + "Export" outline ember

2. Implement export handlers:

**`src/lib/export/pdf.ts`** — Puppeteer + Chromium:

```typescript
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function exportPRDToPDF(prd: PRDDocument, options: PDFOptions): Promise<Buffer> {
  const html = renderPRDHTML(prd, options.theme);
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({
    format: 'A4',
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    printBackground: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-family: monospace; font-size: 9px; color: #7A7468; text-align: right; width: 100%; padding: 0 15mm;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `,
    displayHeaderFooter: true,
  });
  await browser.close();
  return pdf;
}
```

**`src/lib/export/docx.ts`** — using `docx` library:

```typescript
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';

export async function exportPRDToDOCX(prd: PRDDocument): Promise<Buffer> {
  const doc = new Document({
    /* sections... */
  });
  return await Packer.toBuffer(doc);
}
```

**`src/lib/export/markdown.ts`** — straightforward serializer

**`src/lib/export/html.ts`** — semantic HTML5 dengan inline CSS

**`src/lib/export/slack.ts`** — Slack Block Kit JSON payload + "Copy as Slack message" button

**`src/lib/export/jira.ts`** — Atlassian Document Format (ADF) JSON + "Copy as Jira issue body"

3. API route `/api/prd/[prdId]/export/route.ts` POST:
   - Body: `{ format, options }`
   - Stream response untuk PDF/DOCX (large files)
   - Return JSON for Slack/Jira (copy-to-clipboard pattern)

4. PDF Editorial theme harus match design tenet:
   - Cover page (optional): hero serif title + subtitle + metadata
   - Section dividers (optional)
   - Body: serif Fraunces H1 (title only), Inter Tight body
   - Page footer: page number mono ink 25%
   - Watermark optional

**Acceptance**:

- Export PDF → file download, opens in PDF viewer dengan editorial layout
- Export DOCX → opens cleanly in Word/Google Docs
- Export MD → file content valid Markdown, renders correctly
- Slack/Jira → modal "Copy this message" dengan formatted text
- PDF export <15s untuk PRD 5000 words (performance budget)

---

### Task 4.6 — A027 Public Share View

**Spec**: v2.1 section A027. **LIGHT MODE exception**.

**Steps**:

1. Create `src/app/share/[shareToken]/page.tsx`:
   - Public route, no auth required
   - Validate share token via `/api/share/validate` (no RLS bypass — Edge Function with service role)
   - If valid + not expired + is_active → fetch PRD, increment view_count, render `<PublicShareView />`
   - If invalid → render error page "This link has expired or been revoked."

2. Create `src/components/share/public-share-view.tsx`:
   - **LIGHT MODE override** via root `data-theme="light"`
   - Top thin bar:
     - Tier 1 logo kecil + brand "DraftMind" wordmark serif Fraunces left
     - Meta "Public read view · Last updated [time]" mono right
   - Hero:
     - PRD title Fraunces serif H1 besar (1 instance — exception, allowed multiple Fraunces in public read view per Tenet 8 exception)
     - Owner avatar + name + "Public · Read only" badge mono Tenet 3
   - Body:
     - PRD content rendered editorial layout
     - Max-width 720px center
     - Body 16px Inter Tight, line-height 1.6
     - Headings serif Fraunces H1/H2 mix, Inter Tight H3+
     - Callouts bg cream subtle
   - Right rail tipis 200px:
     - Table of contents sticky mono
     - "Copy link" outline button
     - "Comment" disabled (login required)
   - Footer: "Generated with DraftMind ✦ · Try it free" mono ink-tertiary kecil

3. Share creation flow di editor (A012):
   - "Share" button → modal:
     - Toggle "Public read access" → generates share_token
     - Copy link button
     - Optional expiration date picker
     - "Revoke link" button untuk active share

4. Server Action `createShareLink(prdId, expiresAt)`:
   - Insert row prd_shares dengan nanoid 16-char token
   - Return share URL

**Acceptance**:

- Create share link from editor → copy link → visit di incognito browser → public read view renders LIGHT MODE
- View count increments
- Revoke → revisit link shows expired error
- Expiration date enforcement works

---

### Task 4.7 — A028 Activity Log

**Spec**: v2.1 section A028.

**Steps**:

1. Create `src/app/(app)/settings/audit/page.tsx`:
   - Settings tab nav (Audit active)
   - Render `<ActivityLog />`

2. Create `src/components/audit/activity-log.tsx`:
   - Title "Activity log"
   - Right: date range picker mono "Apr 25 — Apr 27 ↓"
   - Filter chip row: All actors / Workspace events / PRD events / AI events / Login events
   - Timeline list grouped by date:
     - Section header tanggal "Today" / "Yesterday" / "Apr 25" mono uppercase 11px ink-tertiary
     - Each event row format: "[time mono] [avatar 24px] [name bold] [verb mono ink-secondary] [link ember underline] · [meta mono]"
     - Examples:
       ```
       10:18  M  Maya Reyes edited Wallet redesign Q2
                 § DARCI Matrix · 1 min ago
       09:47  R  Rizky Pratama commented on Wallet redesign Q2
                 "Risks section needs..." · 56 min ago
       09:12  ✦  AI Copilot generated refinement for Checkout flow Q3
                 Refine · 50ms · 1h ago
       ```
   - Pagination/infinite scroll for older events

3. Mono icons untuk system actors (AI Copilot = ✦ sigil, NOT emoji)

**Acceptance**:

- Activity log shows recent events
- Filter chips narrow events by category
- Date range picker filters events
- Click event link → navigate to relevant resource
- No emoji UI icons

---

### Task 4.8 — A029 AI Run History

**Spec**: v2.1 section A029.

**Steps**:

1. Create `src/app/(app)/ai-runs/page.tsx`:
   - Render `<AIRunHistoryTable />`

2. Create `src/components/audit/ai-run-history-table.tsx`:
   - Title "AI run history"
   - Filter row: All / Generation / Refine / Review / Quick action chips
   - Table compact:
     - Header mono uppercase: TIME / TYPE / PRD / MODEL / DURATION / TOKENS / COST / ACTION
     - Rows:
       - Time mono "10:18 · Today"
       - Type badge Tenet 3 "● Generation" amber dot
       - PRD link ember underline
       - Model mono "claude-sonnet-4-6"
       - Duration mono "2.3s"
       - Tokens mono "1,284 / 4,500"
       - Cost mono "~25 credits"
       - Action: "Replay" outline button (re-run with same input)
   - Empty state untuk no runs

3. Replay logic:
   - Click "Replay" → fetch original input_payload
   - Trigger same AI flow dengan exact same input
   - Compare output with stored output (optional diff view)

**Acceptance**:

- AI runs from seed data + Phase 3 generated runs visible
- Filter chips work
- Replay creates new ai_run dengan same input
- Cost/credit accumulation accurate

---

### Task 4.9 — A030 Notifications Inbox

**Spec**: v2.1 section A030.

**Steps**:

1. Update `src/components/layout/topbar.tsx`:
   - Bell icon dengan unread count badge mono kecil ember (Tenet 2 — dot indicator allowed)
   - Click bell → opens `<NotificationsInbox />` popover

2. Create `src/components/overlays/notifications-inbox.tsx`:
   - Popover anchored to bell, width 380px max-height 480px bg-elevated
   - Header: "Notifications · [N] unread" + "Mark all read" text-link
   - Tab pills: All (active) / Mentions / Reviews — text-only chips
   - List notifications:
     - Each row: avatar 24px + actor name + verb + PRD link + timestamp mono
     - Active/unread item: ember dot 6px kecil left of row (NOT ember bg fill)
     - Hover: bg sedikit lighter
   - Footer: "Notification preferences" text-link → /settings/notifications

3. Realtime subscribe ke notifications table for current user:

   ```typescript
   useEffect(() => {
     const channel = supabase.channel('notifications')
       .on('postgres_changes', {
         event: 'INSERT',
         schema: 'public',
         table: 'notifications',
         filter: `recipient_id=eq.${user.id}`,
       }, (payload) => {
         queryClient.invalidateQueries({ queryKey: ['notifications'] });
         toast(<NotificationToast notification={payload.new} />);
       })
       .subscribe();
     return () => { supabase.removeChannel(channel); };
   }, [user.id]);
   ```

4. Notification types:
   - mention — @ mention di comment
   - review_request — someone requested PRD review from you
   - approval_needed — PRD waiting for your approval
   - comment_reply — reply to your comment
   - ai_suggestion_ready — bg AI run completed
   - integration_event — webhook event (Phase 4 stub)
   - workspace_invite — invited to workspace

**Acceptance**:

- Bell icon shows count badge accurate
- Click bell → notifications panel opens
- Click notification → mark read + navigate to action_url
- Realtime: new notification appears live di tab tanpa refresh
- Mark all read works

---

### Task 4.10 — A031 Command Palette ⌘K

**Spec**: v2.1 section A031. **STRICT NO EMOJI**.

**Steps**:

1. Install + setup `cmdk` library
2. Create `src/components/overlays/command-palette.tsx`:
   - Triggered by ⌘K / Ctrl+K global keyboard shortcut
   - Use `useHotkeys` or custom event listener
   - Modal max-width 720px bg-elevated, backdrop dim halus rgba(0,0,0,0.5) (NOT blur)

3. Layout:
   - Top: input besar dengan icon search mono left + placeholder mono "Search PRDs, run commands, or ask AI…" + ESC kbd hint mono right
   - **Section "JUMP TO"** mono uppercase 11px ink-tertiary:
     - 3-4 PRD items (filtered by query): mono document glyph 16px ink-secondary + title bold + meta mono "PRD · [project_tag]" + StatusPill Tenet 3 right + return arrow ↵ mono
   - **Section "ACTIONS"**:
     - "Draft PRD from brief" — sigil ✦ mono prefix (NOT emoji) + label + meta mono "AI · ~25 credits" right + kbd "⌘N"
     - "Summarize transcript → PRD" — Lucide FileText icon
     - "Start from template" — Lucide LayoutTemplate icon + kbd "⌘T"
     - "Import from Notion / Confluence" — Lucide Upload icon
     - "Export current PRD as PDF" — Lucide Download icon
     - "Refine current section" — Lucide RefreshCw icon
   - Footer thin separator: mono "↑↓ navigate · ↵ select · ⌘K open anytime · esc close"

4. Search backend:
   - Debounced input → query Postgres fulltext on `prds.title` (filtered by workspace)
   - Combine with action items (static list)
   - Action items show always, PRD items filtered

5. Keyboard nav: ↑↓ navigate, Enter select, Esc close, ⌘K toggle

**Acceptance**:

- ⌘K anywhere in app → palette opens
- Type query → filter PRDs + actions
- Enter on PRD → navigate to PRD
- Enter on action → execute (e.g., "Start from template" → /templates)
- Mono icons throughout, NO emoji 📄🌐✅

---

### Task 4.11 — Polish & Performance

**Goal**: Production-ready quality.

**Steps**:

1. **Loading states audit**: setiap route punya `loading.tsx` dengan Skeleton matching expected content
2. **Error boundaries**: `error.tsx` di setiap route group dengan fallback UI editorial style
3. **404**: `not-found.tsx` di app root dengan editorial design
4. **Performance**:
   - Run Lighthouse on `/home`, `/prds`, `/prds/[id]` editor — target > 90 score
   - Optimize images via Next.js `<Image>` di OG generator
   - Code-split heavy components: TiptapEditor lazy loaded
   - Bundle analysis: `pnpm build --analyze` (configure di next.config)
   - Font subset (latin only) untuk reduce woff2 size
5. **Accessibility**:
   - Run axe-core di Playwright E2E
   - All interactive elements keyboard accessible
   - ARIA labels untuk icon-only buttons
   - Color contrast WCAG AA (already enforced via tokens dark/light)
   - Skip-to-content link
   - Focus trap di modals
6. **SEO** (terbatas, app private):
   - Meta tags `<title>` + `<description>` per public route (login, share)
   - OG image dynamic via `/api/og/route.tsx`
   - Robots.txt: disallow `/app/*`, allow `/share/*`

---

### Task 4.12 — Security Hardening

**Steps**:

1. **CSP headers** di `next.config.mjs` headers config
2. **Rate limiting** AI endpoints — pakai Upstash Redis atau Supabase Edge Function:
   - Per workspace: 100 generations/day, 500 refines/day
   - Per user: 10 generations/hour
3. **API key encryption verified**: never expose plaintext
4. **CSRF** — Next.js Server Actions native protection
5. **SQL injection** — Drizzle params (no raw queries with user input)
6. **XSS** — DOMPurify di public share view content render
7. **Audit log immutable**: trigger PostgreSQL `BEFORE UPDATE OR DELETE` on activity_log raise exception

**Acceptance**:

- Penetration test simple: try update via browser DevTools → blocked by RLS
- Rate limit triggered → return 429 dengan retry-after header
- Public share PRD content sanitized (no script execution from user content)

---

### Task 4.13 — Production Deployment Guide

**Goal**: User can deploy to Vercel + VPS following step-by-step guide.

**Steps**:

1. Update `docs/DEPLOYMENT.md`:

**Vercel Deployment**:

```markdown
## Vercel

### Prerequisites

- Vercel account (free tier ok)
- GitHub repository with project
- Supabase production project

### Steps

1. Import GitHub repo to Vercel
2. Set environment variables (production):
   - NEXT_PUBLIC_SUPABASE_URL=...
   - NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   - SUPABASE_SERVICE_ROLE_KEY=...
   - DATABASE_URL=postgres://... (pooler URL)
   - ENCRYPTION_KEY=$(openssl rand -base64 32)
   - NEXT_PUBLIC_APP_URL=https://yourdomain.com
   - DEPLOYMENT_TARGET=vercel
3. Configure deployment region: Singapore (sin1) for Indonesia latency
4. OAuth redirect URLs di Supabase dashboard:
   - https://yourdomain.com/api/auth/callback
   - https://\*-yourorg.vercel.app/api/auth/callback (untuk preview)
5. Custom domain (optional): point CNAME to cname.vercel-dns.com
6. Deploy: push to main branch
```

**VPS Deployment**:

```markdown
## VPS (Ubuntu 22.04 LTS)

### Prerequisites

- VPS dengan minimum 2 GB RAM, 20 GB disk
- Domain pointed to VPS IP
- Supabase production project (or self-hosted Supabase, advanced)

### Steps

1. Install Docker:
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER

2. Clone repo:
   git clone https://github.com/youruser/draftmind.git
   cd draftmind

3. Create .env.production:
   [contents same as Vercel env vars + DEPLOYMENT_TARGET=vps]

4. Build and run:
   docker compose -f docker-compose.yml up -d

5. Setup reverse proxy (Caddy):

   Caddyfile:
   yourdomain.com {
   reverse_proxy localhost:3000
   }

   sudo apt install caddy
   sudo cp Caddyfile /etc/caddy/Caddyfile
   sudo systemctl reload caddy

6. SSL: Caddy auto-generates Let's Encrypt cert, no setup needed

7. Update Supabase OAuth redirects:
   - https://yourdomain.com/api/auth/callback

8. Apply migrations to production DB:
   pnpm db:migrate (against production DATABASE_URL)
```

**Local Development**:

```markdown
## Local Development

### Prerequisites

- Node 20.11+
- pnpm 9.x (corepack enable)
- Supabase CLI
- Docker (untuk Supabase local)

### Steps

1. Clone repo + install:
   git clone ...
   pnpm install

2. Start Supabase local:
   pnpm db:start

3. Setup env:
   cp .env.example .env.local

   # Fill in keys from `pnpm exec supabase status`

4. Migrate + seed:
   pnpm db:migrate
   pnpm db:seed

5. Dev server:
   pnpm dev

6. Visit http://localhost:3000
   - Login: maya@algonetwork.id / demo1234

### Stop:

pnpm db:stop
```

2. Smoke test deployment:
   - Deploy to Vercel preview
   - Login with Google
   - Generate sample PRD
   - Export PDF
   - Verify everything works

3. Smoke test VPS deployment:
   - Same flow on VPS
   - Verify Puppeteer PDF works (alpine + chromium binary)

**Acceptance**:

- DEPLOYMENT.md complete dengan all commands
- User can follow guide and deploy to Vercel in <30 min
- User can follow VPS guide and deploy in <60 min

---

### Task 4.14 — Documentation & Demo Prep

**Goal**: FYP submission ready.

**Steps**:

1. Update `README.md`:
   - Project overview, screenshot
   - Quick start (local dev)
   - Tech stack badges
   - Live demo URL
   - License
   - Author + acknowledgments

2. Generate `docs/USER_GUIDE.md`:
   - Screenshots dari Imagine v2.1 hasil
   - Walkthrough each major feature
   - Tips for getting best AI generations

3. `docs/PRD_SCHEMA.md`:
   - Detail 14 sections + sample JSON
   - For thesis chapter "System Design"

4. Demo video script (optional):
   - 3-min walkthrough storyboard:
     1. Login (15s)
     2. Generate PRD from brief Indonesian context (45s)
     3. Editor + AI suggestions + comments (45s)
     4. AI Review + auto-fix (30s)
     5. Export PDF + Public share (30s)
     6. Tweaks panel showcase (theme/font swap) (15s)

5. FYP report appendix:
   - Screenshot dari Imagine v2.1 sebagai design rationale
   - Architecture diagram dari DATABASE.md + ARCHITECTURE.md
   - Out-of-scope explicit (Master Brief Section 14)

**Acceptance**:

- README clear and professional
- Documentation comprehensive
- Demo video filmed (optional but recommended)
- App publicly demo-able

---

## Definition of Done — Phase 4

- [ ] All 14 tasks acceptance passed
- [ ] All 31 artboards (A001-A031) functional
- [ ] All 7 Tweaks parameters work end-to-end
- [ ] Deployment to Vercel verified
- [ ] Deployment to VPS verified
- [ ] Lighthouse > 90 on key pages
- [ ] Security checklist complete (Master Brief Section 12)
- [ ] All design tenets enforced (visual + lint review)
- [ ] `pnpm check && pnpm e2e` green
- [ ] Documentation comprehensive
- [ ] FYP submission package ready

---

## Anti-Patterns Watch (Final)

Same as previous phases + extra:

- ❌ Command palette items dengan emoji 📄✅ — must be Lucide mono
- ❌ Provider icons official colored brand logos — must be custom mono line glyph
- ❌ Notifications panel dengan ember bg fill on unread row — must be ember dot 6px only
- ❌ Public share view dark mode — must be light mode override
- ❌ Activity log dengan colorful icons per event type — must be mono
- ❌ Export modal preview thumbnail filled with brand colors — must be mono outline
- ❌ Skipping security checklist (RLS, encryption, rate limiting) "for FYP we don't need it"

---

## Final Acceptance Criteria — Project Complete

Project DraftMind dianggap **production-ready FYP submission** kalau:

1. ✅ All 31 artboards (A001-A031) functional sesuai design spec v2.1
2. ✅ Triple deployment verified: local + Vercel + VPS
3. ✅ All design tenet 1-10 enforced
4. ✅ All Tweaks parameter switching works real-time
5. ✅ Auth flow (Google + magic link) works
6. ✅ Generate PRD via 6 different AI providers tested
7. ✅ Export 6 formats works (PDF/DOCX/MD/HTML/Slack/Jira)
8. ✅ Public share works
9. ✅ Real-time updates via Supabase Realtime
10. ✅ RLS enforced (cross-workspace isolation tested)
11. ✅ API keys encrypted
12. ✅ Performance targets met (LCP < 2.5s, AI streaming first token < 2s)
13. ✅ Lighthouse > 90 on home/dashboard/editor
14. ✅ FYP documentation complete
15. ✅ Demo video filmed (optional but recommended)

---

**END OF PHASE 4 PROMPT**

**END OF DRAFTMIND BUILD ROADMAP**

---

## Post-FYP Roadmap (Future Work, Out-of-Scope FYP)

For laporan akhir, mention as "Future Work":

- Real-time multi-cursor collaboration (Yjs presence)
- Mobile responsive + PWA
- Real Slack/Jira webhooks integration
- Stripe/Midtrans payment integration
- Email transactional (SendGrid / Resend)
- OAuth providers selain Google (GitHub, Microsoft)
- AI streaming to client (token-by-token render)
- Audit log granular per-field
- Custom AI provider plugin system
- Version branching + merge
- AI fine-tuning pada PRD library
