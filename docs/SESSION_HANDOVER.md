# DraftMind — Session Handover

> Dibuat: 2026-05-14 | Diperbarui: 2026-05-17 | Versi app: 0.1.0
> Dokumen ini cukup untuk melanjutkan development dari nol tanpa konteks percakapan sebelumnya.

---

## 1. Tech Stack

| Layer                       | Teknologi                                               | Versi            |
| --------------------------- | ------------------------------------------------------- | ---------------- |
| Framework                   | Next.js (App Router, Server Components, Server Actions) | 15.0.4           |
| Runtime                     | React                                                   | 19.0.0           |
| Language                    | TypeScript                                              | 5.5.4            |
| Editor                      | Tiptap (ProseMirror-based)                              | ^2.27.x          |
| Database & Auth             | Supabase (PostgreSQL + Auth + Storage + Realtime)       | ^2.45.0          |
| AI Framework                | Vercel AI SDK (streaming)                               | ^4.0.0           |
| AI Providers                | @ai-sdk/openai, anthropic, google, groq                 | berbagai         |
| AI Observability            | LangSmith                                               | ^0.6.0           |
| Styling                     | Tailwind CSS                                            | 3.4.17           |
| State Management            | Zustand                                                 | ^4.5.0           |
| UI Primitives               | Radix UI (Dialog, Dropdown, Tabs, dll.)                 | latest           |
| Icon Library                | Lucide React                                            | ^0.400.0         |
| Toast                       | Sonner                                                  | ^1.5.0           |
| Image Crop                  | react-avatar-editor                                     | ^15.1.0          |
| Rich Text Export            | docx (DOCX), puppeteer-core + @sparticuz/chromium (PDF) | berbagai         |
| Markdown Parse              | marked, remark-gfm                                      | berbagai         |
| Email                       | Resend                                                  | ^6.12.2          |
| Real-time Collab (optional) | Yjs + @tiptap/extension-collaboration                   | ^13.6.0          |
| Testing                     | Vitest + Playwright                                     | ^2.0.0 / ^1.46.0 |
| Package Manager             | pnpm                                                    | -                |
| Linting                     | ESLint + Prettier + Husky + lint-staged                 | -                |
| Deployment                  | Docker (`output: 'standalone'`) + Caddy reverse proxy   | -                |

---

## 2. Environment Variables

```bash
# === REQUIRED ===
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from: supabase status>    # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=<from: supabase status>        # Supabase service role (admin)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000                 # Public URL of the app
ENCRYPTION_KEY=<32-byte base64>                          # AES-256-GCM untuk provider API keys
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# === OPTIONAL ===
DEPLOYMENT_TARGET=local                                   # 'local' atau 'production'
SKIP_ENV_VALIDATION=false

# Email (kalau tidak diset, email dikirim silently-skipped)
RESEND_API_KEY=re_xxx
EMAIL_FROM=DraftMind <noreply@draftmind.app>

# LangSmith AI observability
LANGCHAIN_API_KEY=ls__xxx
LANGCHAIN_PROJECT=draftmind
LANGCHAIN_TRACING_V2=true

# Webhook secret - validasi HMAC-SHA256 dari Supabase webhooks
SUPABASE_WEBHOOK_SECRET=your-webhook-secret
```

---

## 3. Cara Run Local

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env
cp .env.example .env.local
# Edit .env.local dengan nilai dari supabase status

# 3. Start Supabase local
pnpm db:start
# Atau: supabase start

# 4. Apply migrations
pnpm db:migrate
# Atau: supabase migration up

# 5. (Opsional) Seed data
pnpm db:seed

# 6. Run dev server
pnpm dev
# → http://localhost:3000
```

### Perintah Penting

```bash
pnpm dev              # Development server (hot reload)
pnpm build            # Production build
pnpm start            # Production server
pnpm typecheck        # TypeScript check (wajib sebelum commit)
pnpm lint             # ESLint check
pnpm test             # Unit tests (Vitest)
pnpm test:e2e         # E2E tests (Playwright)

pnpm db:start         # Start Supabase local docker
pnpm db:stop          # Stop Supabase local docker
pnpm db:reset         # Reset DB + re-apply migrations + seed
pnpm db:migrate       # Apply pending migrations
pnpm db:seed          # Seed data dari scripts/seed.ts
pnpm db:types         # Regenerate TypeScript types dari DB schema

supabase status       # Lihat URL + keys local Supabase
supabase db push      # Push ke Supabase Cloud (perlu supabase link dulu)
```

### Docker Build (Production)

```bash
docker build -t draftmind .
docker run -p 3000:3000 --env-file .env.local draftmind
```

---

## 4. Struktur Folder

```
draftmind/
├── src/
│   ├── middleware.ts                   # ← Auth guard, role routing, session-expired detect
│   ├── env.ts                          # ← t3-env (type-safe env validation)
│   ├── app/                            # Next.js App Router
│   │   ├── (admin)/admin/              # Super admin panel
│   │   │   ├── layout.tsx              # ← Guard: is_super_admin check + AdminShell
│   │   │   ├── page.tsx                # Dashboard overview
│   │   │   ├── users/page.tsx          # User management
│   │   │   ├── workspaces/             # Workspace monitoring
│   │   │   ├── prds/page.tsx           # PRD monitoring
│   │   │   ├── ai-runs/page.tsx        # AI runs monitoring
│   │   │   ├── analytics/page.tsx      # Platform analytics
│   │   │   ├── templates/page.tsx      # Template library view
│   │   │   ├── announcements/          # Broadcast notifikasi
│   │   │   ├── providers/              # AI provider config
│   │   │   ├── activity/               # Activity log
│   │   │   ├── system-logs/            # Error/warn/info logs
│   │   │   ├── tickets/                # Support ticket management
│   │   │   └── settings/page.tsx       # System config (read-only)
│   │   │
│   │   ├── (app)/                      # User-facing app
│   │   │   ├── layout.tsx              # ← Guard: requireUser() + AppShell SSR props
│   │   │   ├── dashboard/page.tsx      # Home feed
│   │   │   ├── prds/
│   │   │   │   ├── page.tsx            # PRD list
│   │   │   │   ├── new/page.tsx        # Create PRD form (AI generate)
│   │   │   │   ├── pipeline/page.tsx   # Kanban board
│   │   │   │   └── [prdId]/
│   │   │   │       ├── page.tsx        # PRD editor
│   │   │   │       ├── ai-review/      # AI review & findings
│   │   │   │       └── version-history/ # Version history
│   │   │   ├── templates/page.tsx      # Template library
│   │   │   ├── ai-runs/page.tsx        # AI runs history
│   │   │   ├── tickets/                # Support ticket (submit + list)
│   │   │   ├── workspace/
│   │   │   │   ├── page.tsx            # redirect → /workspace/members
│   │   │   │   ├── layout.tsx          # Workspace layout wrapper
│   │   │   │   ├── members/page.tsx    # Member management
│   │   │   │   ├── activity/page.tsx   # Workspace activity log
│   │   │   │   └── settings/page.tsx   # Workspace settings (admin only)
│   │   │   ├── invite/[id]/page.tsx    # Accept invitation
│   │   │   └── notifications/          # Notifikasi actions
│   │   │
│   │   ├── (auth)/login/               # Login page (email/password + remember me)
│   │   ├── share/[shareToken]/         # Public PRD share (no auth)
│   │   ├── api/
│   │   │   ├── auth/callback/          # OAuth callback
│   │   │   ├── log/                    # Client-side log endpoint
│   │   │   ├── og/                     # Open Graph image (static)
│   │   │   ├── prd/
│   │   │   │   ├── generate/           # AI PRD generation (streaming)
│   │   │   │   ├── ai-review/          # AI review
│   │   │   │   ├── ai-suggest/         # Inline AI suggestion
│   │   │   │   ├── refine/             # Section refine
│   │   │   │   ├── export/             # Export (MD/HTML/PDF/DOCX/Slack/Jira)
│   │   │   │   ├── [prdId]/share/      # Create share link
│   │   │   │   └── [prdId]/versions/   # Version snapshots
│   │   │   ├── providers/              # AI provider CRUD
│   │   │   ├── workspace/
│   │   │   │   ├── avatar/             # Upload workspace avatar
│   │   │   │   ├── invite/             # Send invitation email
│   │   │   │   └── members/            # Member management
│   │   │   └── webhooks/supabase/      # Supabase webhook (HMAC-SHA256 validated)
│   │   │
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout (fonts, toaster, TweaksProvider)
│   │   ├── error.tsx                   # Root error boundary
│   │   ├── not-found.tsx               # 404 page
│   │   ├── privacy/page.tsx            # Privacy policy
│   │   └── terms/page.tsx              # Terms of service
│   │
│   ├── components/
│   │   ├── admin/                      # Admin-specific components (AdminShell, users table)
│   │   ├── audit/                      # Activity log, AI run table
│   │   ├── auth/                       # Login form (with remember-me, session-expired banner)
│   │   ├── dashboard/                  # Home feed, stat cards, etc.
│   │   ├── editor/                     # PRD editor (shell, panels, toolbar)
│   │   │   ├── editor-shell.tsx        # ← Main editor orchestrator
│   │   │   ├── tiptap-editor.tsx       # Tiptap instance + extensions
│   │   │   ├── outline-panel.tsx       # Left panel (outline/comments/info tabs)
│   │   │   ├── panel-collapsed-rail.tsx # Collapsed state for left/right panels
│   │   │   ├── comments-panel.tsx      # Comments system
│   │   │   ├── comments-actions.ts     # Server actions untuk comments
│   │   │   ├── ai-copilot-panel.tsx    # Right panel AI chat
│   │   │   ├── ai-assist-panel.tsx     # Inline AI assist (dari bubble toolbar)
│   │   │   ├── bubble-toolbar.tsx      # Selection toolbar (bold, italic, link, AI, comment)
│   │   │   ├── selection-toolbar.tsx   # Extended selection toolbar variant
│   │   │   ├── slash-menu.tsx          # `/` commands menu
│   │   │   ├── inline-comment-popover.tsx # Comment from selection
│   │   │   ├── editor-header.tsx       # Status, share, export, duplicate, last editor
│   │   │   ├── health-score-display.tsx # Health score ring + breakdown
│   │   │   ├── history-panel.tsx       # Version history
│   │   │   ├── markdown-view.tsx       # Read-only markdown rendering
│   │   │   ├── presence-avatars.tsx    # Collaboration avatars
│   │   │   ├── cursor-overlay.tsx      # Remote cursors
│   │   │   └── section-badge.tsx       # Section badge overlay
│   │   ├── export/                     # Export modal
│   │   ├── generate/                   # PRD generation form + loading screen
│   │   ├── icons/                      # Logo variants + provider icons (OpenAI, Anthropic, etc.)
│   │   ├── layout/                     # AppShell, Sidebar, SidebarCollapsedRail, Topbar, WorkspaceSwitcher
│   │   ├── overlays/                   # Command palette, NotificationsInbox
│   │   ├── refine/                     # AI review page components
│   │   ├── settings/                   # ProfileModal (edit nama, upload foto, password change)
│   │   ├── share/                      # Public share view
│   │   ├── templates/                  # Template library
│   │   ├── tweaks/                     # TweaksProvider (injects CSS vars dari Zustand ke DOM)
│   │   ├── version/                    # Version history page
│   │   ├── workspace/                  # Workspace hub, members, settings
│   │   └── ui/                         # Design system primitives (button, card, dialog, etc.)
│   │
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── prompts/                # AI prompt templates (generate, review, refine, suggest)
│   │   │   ├── provider-router.ts      # Multi-provider routing + fallback
│   │   │   ├── providers.ts            # Provider client factory
│   │   │   ├── streaming.ts            # Vercel AI SDK streaming helpers
│   │   │   ├── schema.ts               # Zod schemas untuk AI output
│   │   │   ├── langsmith.ts            # LangSmith tracing setup
│   │   │   └── provider-icons.ts       # Provider logo mapping
│   │   ├── auth/permissions.ts         # requireUser, requireWorkspaceRole
│   │   ├── db/queries/                 # Typed DB query helpers (prd, workspace, version, etc.)
│   │   ├── editor/extensions/          # Custom Tiptap extensions
│   │   │   ├── comment-mark.ts         # CommentMark (highlight + click)
│   │   │   ├── section-visibility.ts   # Hide/show sections
│   │   │   ├── ai-suggestion-mark.ts   # AI suggestion highlight
│   │   │   ├── objective-node.ts       # PRD Objective structured node
│   │   │   ├── user-story-node.ts      # PRD User Story structured node
│   │   │   ├── requirement-node.ts     # PRD Requirement structured node
│   │   │   ├── risk-node.ts            # PRD Risk structured node
│   │   │   └── metric-node.ts          # PRD Metric structured node
│   │   ├── email/
│   │   │   ├── send.ts                 # Resend email sender
│   │   │   └── templates.ts            # Email templates (invite, etc.)
│   │   ├── export/                     # Export logic (docx.ts, html.ts, pdf.ts, markdown.ts, slack.ts, jira.ts, tiptap-html.ts)
│   │   ├── logging/
│   │   │   ├── system-log.ts           # logError, logWarn, logInfo
│   │   │   └── activity-log.ts         # logActivity
│   │   ├── notifications/send.ts       # sendNotification helper
│   │   ├── prd/
│   │   │   ├── schema.ts               # PRDDocument type + TiptapContent
│   │   │   ├── health-score.ts         # Health score calculator
│   │   │   ├── tiptap-content.ts       # PRDDocument ↔ TiptapDoc converter
│   │   │   ├── markdown.ts             # tiptapToPlainText (Tiptap JSON → plain text / markdown)
│   │   │   └── readability.ts          # computeReadability (word count, read time, sentence avg)
│   │   ├── tweaks/tokens.ts            # Konstanta opsi untuk Tweaks (theme, font, density, accent, radius)
│   │   └── supabase/
│   │       ├── client.ts               # Browser Supabase client
│   │       ├── server.ts               # Server Supabase client (SSR)
│   │       ├── middleware.ts           # updateSession helper untuk middleware.ts
│   │       └── admin.ts               # Admin client (bypasses RLS)
│   │
│   ├── hooks/
│   │   ├── use-realtime-subscription.ts  # Generic Supabase Realtime helper
│   │   ├── use-prd-presence.ts           # Presence/cursor awareness (Yjs)
│   │   ├── use-refresh-on-focus.ts       # router.refresh() on tab focus
│   │   ├── use-prd.ts                    # updateStatus + togglePin helpers (wraps server actions)
│   │   ├── use-debounce.ts               # Generic debounce hook
│   │   ├── use-keyboard.ts               # Keyboard shortcut hook
│   │   ├── use-local-storage.ts          # localStorage hook dengan SSR safety
│   │   ├── use-supabase.ts               # Supabase client hook
│   │   └── use-tweaks.ts                 # Re-export useTweaksStore (alias)
│   │
│   ├── stores/
│   │   ├── editor-store.ts               # Zustand: panel state, AI assist, current section
│   │   ├── user-store.ts                 # Zustand: name, email, avatarUrl, openTicketCount
│   │   ├── command-palette-store.ts      # Zustand: command palette open/close
│   │   └── tweaks-store.ts               # Zustand (persisted): theme, font, density, accent, radius
│   │
│   └── types/
│       ├── prd.ts                        # PRD_SECTION_LABELS, PRD status types
│       ├── activity.ts                   # Activity log types
│       ├── database.ts                   # Generated Supabase DB types
│       ├── provider.ts                   # AI provider types
│       └── workspace.ts                  # Workspace member/invitation types
│
├── supabase/
│   ├── migrations/                   # 34 migration files (0001–0034)
│   └── config.toml                   # Supabase local config (Google OAuth disabled)
│
├── docs/
│   ├── FEATURE_OVERVIEW.md           # Dokumentasi fitur per role
│   ├── WORKFLOW_ADMIN.md             # Workflow alur kerja admin
│   ├── WORKFLOW_USER.md              # Workflow alur kerja user
│   └── SESSION_HANDOVER.md           # File ini
│
├── tests/smoke/                      # Smoke tests (Vitest)
├── scripts/                          # seed.ts, generate-types.ts
├── public/                           # Static assets
├── Dockerfile                        # Production Docker image
├── next.config.mjs                   # Next.js config (CSP, image domains)
├── tailwind.config.ts                # Tailwind config
└── package.json
```

---

## 5. Database Schema (Tabel Utama)

| Tabel                   | Keterangan                                                                                                                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`              | Data user (full_name, email, is_super_admin, avatar_url, avatar_color_seed, role_self_reported, force_password_change)                                                                                                                                                                      |
| `workspaces`            | Workspace (name, slug, owner_id, icon_custom_url, industry, team_size)                                                                                                                                                                                                                      |
| `workspace_members`     | Join table (workspace_id, user_id, role: admin/editor/commenter/viewer, last_active_at). RLS UPDATE: ada 2 policy — (1) admin bisa update semua member di workspace mereka, (2) setiap user bisa update row mereka sendiri (migration 0037)                                                 |
| `workspace_invitations` | Undangan (email, role, expires_at, accepted_at, revoked_at)                                                                                                                                                                                                                                 |
| `prds`                  | PRD documents (title, content JSON, tiptap_content JSON, status, health_score, hidden_sections, last_edited_by uuid → profiles)                                                                                                                                                             |
| `prd_versions`          | Snapshot versi PRD (version_number, content, created_by)                                                                                                                                                                                                                                    |
| `prd_shares`            | Share links (share_token, is_active, expires_at, view_count)                                                                                                                                                                                                                                |
| `prd_templates`         | Template PRD (name, description, category, is_built_in, use_count)                                                                                                                                                                                                                          |
| `comments`              | Komentar (prd_id, author_id, parent_id, body, selection_range JSON, resolved_at)                                                                                                                                                                                                            |
| `ai_runs`               | Log penggunaan AI (type, status, prd_id, input_tokens, output_tokens, total_tokens)                                                                                                                                                                                                         |
| `ai_review_findings`    | Hasil AI review (ai_run_id, severity, section, finding, recommendation)                                                                                                                                                                                                                     |
| `providers`             | AI provider config (type, display_name, api_key encrypted, base_url, priority, status, default_model)                                                                                                                                                                                       |
| `notifications`         | Notifikasi user (recipient_id, type, title, body, read_at, resource_type, resource_id, action_url)                                                                                                                                                                                          |
| `activity_log`          | Log aktivitas (actor_id, type, resource_type, resource_id, workspace_id)                                                                                                                                                                                                                    |
| `system_logs`           | Log sistem (level, source, message, metadata, user_id, resolved_at)                                                                                                                                                                                                                         |
| `tickets`               | Support ticket (user_id, category, subject, message, status: open/in_progress/resolved)                                                                                                                                                                                                     |
| `yjs_documents`         | Yjs CRDT documents (collaborative editing). Kolom: `id`, `prd_id` (FK → prds CASCADE DELETE), `data` (bytea), `created_at`, `updated_at`. RLS: workspace-aware — READ untuk semua workspace member, WRITE hanya admin dan editor. Migration: 0020 (create) + 0036 (fix RLS + tambah prd_id) |

**Realtime enabled tables:** `prds`, `comments`, `notifications`, `workspace_members`, `workspace_invitations`, `profiles`, `workspaces`, `tickets`

---

## 6. Role & Permission System

### Role Hierarchy (per workspace)

```
admin > editor > commenter > viewer
```

### Permission Matrix

| Aksi                        | admin               | editor      | commenter | viewer |
| --------------------------- | ------------------- | ----------- | --------- | ------ |
| Baca PRD                    | ✅                  | ✅          | ✅        | ✅     |
| Buat PRD                    | ✅                  | ✅          | ❌        | ❌     |
| Edit PRD                    | ✅                  | ✅          | ❌        | ❌     |
| Hapus PRD                   | ✅                  | ✅          | ❌        | ❌     |
| Ubah status PRD             | ✅                  | hanya owner | ❌        | ❌     |
| Gunakan AI                  | ✅                  | ✅          | ❌        | ❌     |
| Tambah komentar             | ✅                  | ✅          | ✅        | ❌     |
| Edit/hapus komentar sendiri | ✅                  | ✅          | ✅        | ❌     |
| Resolve/reopen komentar     | ✅                  | ✅          | ✅        | ❌     |
| Invite member               | ✅                  | ❌          | ❌        | ❌     |
| Hapus member                | ✅                  | ❌          | ❌        | ❌     |
| Ubah role member            | ✅                  | ❌          | ❌        | ❌     |
| Workspace settings          | ✅                  | ❌          | ❌        | ❌     |
| Submit support ticket       | semua authenticated | -           | -         | -      |
| Super admin panel           | is_super_admin flag | -           | -         | -      |

### Auth Guard Pattern

```typescript
// Server Actions
const { user } = await requireWorkspaceRole(workspaceId, ['admin', 'editor']);

// API Routes
const user = await requireUser(); // hanya cek login
await requireWorkspaceRole(workspaceId, ['admin']); // cek role

// Layout (admin panel)
if (!profile?.is_super_admin) redirect('/dashboard');

// Middleware (src/middleware.ts)
// Otomatis redirect: admin → /admin, user → /dashboard, unauthorized → /login
```

---

## 7. Fitur yang Sudah Diimplementasi

### Super Admin (`/admin`)

- ✅ Dashboard overview (stats, system health, AI usage, LangSmith, providers, top PRDs, recent activity, recent errors)
- ✅ User management (list, pagination, ban status, toggle super admin, disable account)
- ✅ Workspace management (list, member count, workspace icon)
- ✅ PRD monitoring (semua PRD platform-wide, pagination)
- ✅ AI Runs monitoring (platform-wide)
- ✅ Analytics (PRDs by status, AI runs by type, stats) — polling 60s via AnalyticsPoller
- ✅ Templates monitoring (built-in + custom)
- ✅ Announcements (kirim ke all/role/user, history dengan pagination)
- ✅ AI Providers (add wizard 4-step, connect/disconnect, priority routing, test connection, delete)
- ✅ Activity log (platform-wide) — polling 30s dengan visibility check
- ✅ System logs (filter, resolve, mark all resolved, download, copy dengan Safari fallback)
- ✅ Settings (read-only config: AI, security, email, storage)
- ✅ Tickets (list semua ticket Realtime `event: '*'` + polling 5s fallback, detail panel, update status Open/In Progress/Resolved, auto-notif user dengan nama admin yang handle, badge count open tickets di sidebar — real-time via Zustand + Realtime subscription)

### Workspace Admin & Editor (`/dashboard`)

- ✅ Dashboard (greeting, 4 stat cards, continue working, needs attention, activity feed, real-time sync)
- ✅ PRD list (`/prds`) dengan tabel, Realtime update via workspace subscription
- ✅ PRD pipeline board (kanban)
- ✅ Create PRD (`/prds/new`) — form + AI generate (streaming) + loading screen
- ✅ PRD Editor (Tiptap, auto-save, markdown mode, section visibility) — setelah save sukses, `localUpdatedAt` dan `localLastEditor` diupdate client-side; keduanya di-pass ke `EditorHeader` (`updatedAt={localUpdatedAt}`, `lastEditorName/Email/Avatar`) agar footer "Saved X ago" dan header "last edit" langsung update tanpa server round-trip dan tanpa reload
- ✅ Bubble toolbar (bold, italic, link, AI assist, comment)
- ✅ Slash menu (`/` untuk insert commands)
- ✅ Export (Markdown, HTML, PDF, DOCX, Slack, Jira)
  - **Markdown / HTML / PDF / DOCX**: download file
  - **Slack**: copy Slack mrkdwn format ke clipboard
  - **Jira**: copy Jira wiki markup format ke clipboard
  - Entry point 1 — `export-modal.tsx`: Slack & Jira ditampilkan dengan badge "Coming Soon" karena planned feature = OAuth integration langsung ke workspace Slack/Jira (bukan fungsi copy). Fungsi copy clipboard tetap tersedia via entry point 2.
  - Entry point 2 — editor header `•••` dropdown: Slack & Jira aktif, langsung copy ke clipboard
- ✅ Share link (create, copy, public read-only view dengan hidden sections filter)
- ✅ Status management (dropdown: draft/in_review/reviewed/refined/approved/final) — optimistic update
- ✅ Duplicate PRD
- ✅ Delete PRD (dengan konfirmasi)
- ✅ Save as template dari PRD existing
- ✅ Version history (auto-snapshot, view, restore)
- ✅ AI Generate PRD
- ✅ AI Review (findings per severity, health score breakdown)
- ✅ AI Refine Section (via copilot panel)
- ✅ AI Inline Suggest (bubble toolbar → AI Assist panel → insert)
- ✅ AI Copilot Panel (chat interface)
- ✅ Comments system:
  - Add dengan seleksi teks (CommentMark highlight)
  - Add tanpa seleksi (footer form)
  - Thread & inline reply
  - Resolve / Reopen
  - Edit komentar sendiri
  - Delete komentar sendiri
  - Filter: Open / Resolved / @Me
  - Reverse navigation (klik highlight → scroll sidebar)
  - Forward navigation (klik komentar → scroll editor)
  - Real-time sync (Supabase Realtime)
  - Notifikasi (mention, reply, new comment)
  - Restore marks setelah reload
- ✅ Collaboration presence (cursor overlay, avatar, section badge, content sync)
- ✅ Workspace members (list, invite, role change, remove, pending invitations)
- ✅ Workspace settings (name, slug, industry, team_size, avatar upload dengan drag+zoom)
- ✅ Workspace activity log — polling 30s dengan visibility check
- ✅ Template library (built-in + custom, use template)
- ✅ AI Runs history
- ✅ Notifications bell icon (real-time, 13 tipe, mark as read, 2 tab: Inbox + Announcements)
  - Tab Inbox: mention, review_request, approval_needed, comment_reply, comment_added, ai_suggestion_ready, workspace_invite, prd_duplicated, member_joined, member_removed, invitation_declined, status_changed
  - Tab Announcements: integration_event, ticket_update
- ✅ Profile (edit nama, upload foto dengan crop+zoom, password change) — optimistic update via Zustand `useUserStore`
- ✅ Last editor info di editor header: nama + avatar orang yang terakhir menyimpan PRD (bukan selalu current user)
- ✅ Popup saat klik avatar last editor: menampilkan nama, email, dan foto profil
- ✅ Command palette (search PRD, Cmd+K)
- ✅ Workspace switcher (dengan dropdown create new)
- ✅ Invite flow (`/invite/[id]` — accept/decline)
- ✅ Health score display (score + breakdown per dimensi)
- ✅ Outline panel (navigasi section, scroll sync, show/hide section)
- ✅ Info tab di outline panel: readability score, word count, read time
- ✅ Support tickets (`/tickets`) — submit, list status, Realtime update, badge di sidebar (open + in_progress), notifikasi "Ticket received" di bell icon (tab Announcements) saat submit
- ✅ Sidebar collapsed state (SidebarCollapsedRail — icon-only rail dengan tooltip + popover profile)
- ✅ Recent PRDs section di sidebar (5 terbaru milik user)

### Personalization (Tweaks)

- ✅ Theme: Dark / Light (default: light)
- ✅ Font: Fraunces+Inter / Playfair+Inter / Inter Tight / Geist / IBM Plex / DM Serif+DM Sans
- ✅ Density: Compact / Cozy
- ✅ Accent color: Ember / Forest / Deep Blue / Plum / Charcoal
- ✅ Border radius: Sharp / Default / Rounded
- ✅ Disimpan di `localStorage` via Zustand `persist` (key: `draftmind-tweaks`)
- ✅ Diapply ke DOM via `TweaksProvider` (`data-theme`, `data-font`, `data-density`, `data-accent`, `data-radius` di `<html>`)

### Login & Auth Flow

- ✅ Email/password login
- ✅ Remember Me checkbox (sets `remember_me` cookie, max-age 30 hari)
- ✅ Session expired detection (middleware detects stale cookie, redirects dengan `?reason=session_expired`, login page menampilkan banner)
- ✅ `force_password_change` — admin reset password user → flag di-set true di DB → middleware intercept semua route → redirect ke `/change-password` → user wajib ganti password sebelum bisa akses halaman lain → setelah ganti password, flag di-clear dan redirect ke `/dashboard`
- ✅ Banned/disabled user: pesan spesifik (bukan generic error)
- ✅ Role-based redirect setelah login: super admin → `/admin`, user → `/dashboard`

### Commenter

- ✅ Semua fitur baca
- ✅ Add/edit/delete komentar sendiri
- ✅ Resolve/reopen komentar
- ❌ Create/edit/delete PRD (diblokir)
- ❌ Fitur AI (diblokir)

### Public (tanpa login)

- ✅ Baca PRD via share link (`/share/[token]`)
- ✅ Validasi token (expired, revoked)
- ✅ View counter
- ✅ Filter hidden sections

---

## 8. Key Patterns & Conventions

### Server Actions vs API Routes

- **Server Actions** (`'use server'`): untuk mutasi dari form/client component (comments, PRD save, workspace settings)
- **API Routes** (`route.ts`): untuk streaming AI, binary response (export), atau endpoint eksternal (webhooks)

### 3-Layer Rule (enforced)

Setiap fitur harus melewati:

1. **UI** (component) → validasi input
2. **Server Action / API Route** → auth check + business logic
3. **Database** (Supabase + RLS) → row-level security

Tidak boleh ada direct DB call dari komponen, tidak boleh ada mock/placeholder di production path.

### Error Handling

- Server errors → `logError()` ke tabel `system_logs`, **jangan expose** ke user
- User-facing error → pesan generik ("Something went wrong")
- AI errors → caught, logged, stream ditutup gracefully

### Supabase Client Usage

```typescript
createClient(); // user-scoped (respects RLS) — untuk semua user operations
createAdminClient(); // bypasses RLS — hanya untuk admin panel dan migrations
```

### Realtime Pattern

```typescript
useRealtimeSubscription({
  channel: `comments-${prdId}`,
  table: 'comments',
  filter: `prd_id=eq.${prdId}`,
  onChange: () => loadData(),
});
```

Untuk kasus khusus (admin tickets, app-shell badge), subscription dibuat manual langsung di komponen dengan `useEffect` + cleanup `removeChannel`.

### Optimistic Update Pattern (Zustand)

```typescript
// 1. Snapshot state sekarang
const originalName = useUserStore.getState().name;

// 2. Update store dulu (UI langsung berubah)
setStoreName(newName);

// 3. Kirim ke server
const result = await updateProfileName(newName);

// 4. Rollback jika gagal
if (result.error) {
  setStoreName(originalName);
  toast.error('Gagal menyimpan');
}
```

### Zustand Stores Summary

| Store                      | Isi                                                           | Persisted?          |
| -------------------------- | ------------------------------------------------------------- | ------------------- |
| `user-store.ts`            | `name`, `email`, `avatarUrl`, `openTicketCount: number\|null` | Tidak               |
| `editor-store.ts`          | panel state, AI assist mode, current section                  | Tidak               |
| `command-palette-store.ts` | `open: boolean`                                               | Tidak               |
| `tweaks-store.ts`          | theme, font, density, accent, radius                          | Ya (`localStorage`) |

`openTicketCount: number | null` — null = belum diinisialisasi (mencegah hydration flash). Sidebar fallback ke server prop selama null, switch ke store value setelah AppShell `useEffect` jalan.

### Tweaks Pattern (Personalization)

```typescript
// TweaksProvider (mounted di root layout) meng-inject ke DOM:
root.dataset.theme = theme; // data-theme="light"
root.dataset.font = font; // data-font="fraunces-inter"
root.dataset.density = density; // data-density="compact"
root.dataset.accent = accent; // data-accent="ember"
root.dataset.radius = radius; // data-radius="default"

// Tailwind CSS membaca data-* attributes via selector:
// [data-accent="ember"] { --color-accent: ... }
```

### Post-Save Local State Pattern (Editor)

Props SSR (`prd.updated_at`, `lastEditorName`, `lastEditorAvatar`) tidak pernah berubah client-side setelah halaman dimuat. Daripada memanggil `router.refresh()` (yang men-trigger `editor.commands.setContent()` via useEffect di `tiptap-editor.tsx` dan merusak cursor/selection), gunakan local state yang diinisialisasi dari SSR props dan diupdate segera setelah save sukses:

```typescript
const [localUpdatedAt, setLocalUpdatedAt] = useState<string>(prd.updated_at);
const [localLastEditor, setLocalLastEditor] = useState({
  name: lastEditorName,
  email: lastEditorEmail,
  avatar: lastEditorAvatar,
});

// Di dalam handleUpdate dan handleInsert, setelah savePRDContent() return { ok: true }:
setLocalUpdatedAt(new Date().toISOString());
setLocalLastEditor({ name: userName, email: userEmail, avatar: userAvatar ?? null });
```

### Global Badge Count (Sidebar Tickets)

`AppShell` (selalu mounted di semua user pages) punya Realtime subscription ke tabel `tickets` dengan filter `user_id=eq.${userId}`, `event: '*'`. Setiap INSERT atau UPDATE triggers `getUnresolvedTicketCount()` (server action) → `setOpenTicketCount(count)` ke `user-store`. Sidebar baca dari store dengan fallback ke SSR prop kalau store masih null.

### Middleware Auth Flow (`src/middleware.ts`)

1. `updateSession` refresh token Supabase
2. Jika user tidak ada dan bukan public route → redirect ke `/login` (dengan `?redirectTo=...`)
3. Jika ada session cookie tapi user null → stale/banned session, clear cookies dulu
4. Jika user ada dan hits auth/admin/user route → cek `is_super_admin` dari profiles
5. Super admin di user route → redirect `/admin`; regular user di admin route → redirect `/dashboard`

### Realtime + Polling Pattern (seluruh app)

Dua mekanisme dipakai secara konsisten:

- **Realtime subscription (Supabase)** — untuk data yang sering berubah dan butuh update instan (tickets, PRDs, notifications, workspace members, comments)
- **Polling fallback** — untuk halaman SSR yang tidak punya Realtime subscription. Pattern: client component minimal (`return null`) dengan `setInterval` + visibility check (pause saat tab tidak aktif) → `router.refresh()`

Polling intervals yang dipakai:

- **5s** — Admin System Logs, Admin Tickets fallback
- **10s** — Notifications bell, Admin Providers stats
- **30s** — Workspace Activity, Admin Activity Log, Dashboard, AI Runs user, Workspace Members
- **60s** — Admin Overview, Admin PRDs, Admin AI Runs, Templates user, Admin Templates, Share link

**Pathname guard di AppShell PRD Realtime:**

- Saat user di `/prds/[id]` (editor), `router.refresh()` di-skip untuk mencegah reset konten Tiptap
- Di semua halaman lain, PRD change trigger refresh normal

---

## 9. File Paling Kritis

| File                                        | Kenapa Kritis                                                                                                                                       |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/middleware.ts`                         | Auth guard + role routing untuk seluruh app                                                                                                         |
| `src/components/editor/editor-shell.tsx`    | Orchestrator editor utama — semua panel, save, AI, presence, comments                                                                               |
| `src/components/editor/editor-header.tsx`   | Status, share, export, last editor avatar + popup; menerima `updatedAt: string` prop (bukan baca `prd.updated_at` langsung) untuk "last edit X ago" |
| `src/components/editor/tiptap-editor.tsx`   | Konfigurasi Tiptap + semua extension                                                                                                                |
| `src/components/layout/app-shell.tsx`       | Shell utama user-facing: sidebar toggle, global ticket badge subscription, Realtime                                                                 |
| `src/lib/ai/provider-router.ts`             | Multi-provider routing + fallback logic                                                                                                             |
| `src/lib/auth/permissions.ts`               | requireUser, requireWorkspaceRole — pondasi auth                                                                                                    |
| `src/lib/supabase/admin.ts`                 | Admin client — jangan dipakai di user-facing code                                                                                                   |
| `src/components/editor/comments-actions.ts` | Semua server actions untuk comments (dengan role check)                                                                                             |
| `src/lib/editor/extensions/comment-mark.ts` | CommentMark Tiptap extension                                                                                                                        |
| `src/stores/editor-store.ts`                | Global editor state (panel open/close, AI assist, current section)                                                                                  |
| `src/stores/user-store.ts`                  | Zustand: name, avatarUrl, openTicketCount (optimistic + badge count)                                                                                |
| `src/stores/tweaks-store.ts`                | Zustand persisted: theme, font, density, accent, radius                                                                                             |
| `supabase/migrations/`                      | 34 migration files (0001–0034) — jangan ubah yang sudah diapply                                                                                     |

---

## 10. Hal yang Perlu Diingat

1. **Sebelum commit:** selalu `pnpm typecheck && pnpm lint`
2. **Migration:** migration baru harus dibuat dengan nama `[XXXX]_nama.sql` (increment dari **0034**)
3. **Admin client:** `createAdminClient()` bypass RLS — jangan gunakan di user-facing page/action
4. **Provider API key:** dienkripsi dengan AES-256-GCM sebelum disimpan ke DB — jangan simpan plaintext
5. **Comment marks:** setelah delete/resolve comment, harus panggil `unsetComment(id)` di editor dan save
6. **Hidden sections:** disimpan di `prds.hidden_sections[]` dan di-filter saat share link diakses
7. **Realtime cleanup:** setiap komponen yang subscribe harus cleanup channel di `return () => supabase.removeChannel(sub)`
8. **Export PDF:** pakai puppeteer-core + Chromium — lambat, timeout 30s di server
9. **Webhook security:** `src/app/api/webhooks/supabase/route.ts` validasi HMAC-SHA256 dengan `SUPABASE_WEBHOOK_SECRET` — pastikan env var di-set sebelum enable webhook di Supabase dashboard
10. **`last_edited_by`:** kolom di tabel `prds` — di-set setiap kali `savePRDContent()` dipanggil
11. **`useUserStore`:** seed store saat profile modal dibuka (`setUser(...)`) agar optimistic update bisa rollback ke nilai asli. `openTicketCount` di-seed dari AppShell `useEffect` via SSR prop, diupdate via Realtime
12. **`slugify`:** selalu import dari `@/lib/utils/slug` — jangan buat fungsi lokal. Dipakai di `editor-header.tsx` (filename download) dan `api/prd/export/route.ts` (Content-Disposition header)
13. **`localUpdatedAt` / `localLastEditor` di editor:** local state di `editor-shell.tsx` yang diinisialisasi dari SSR props (`prd.updated_at`, `lastEditorName`, dll.) dan diupdate client-side setelah setiap save sukses. Ini yang memperbarui footer "Saved X ago" dan header "last edit". Jangan pakai `router.refresh()` untuk ini — akan men-trigger `editor.commands.setContent()` di `tiptap-editor.tsx` (useEffect line ~130) dan merusak cursor/selection user
14. **`EditorHeader` TIDAK boleh baca `prd.updated_at` langsung** — harus pakai prop `updatedAt: string` yang diteruskan dari `localUpdatedAt` di `EditorShell`. `prd.updated_at` adalah SSR prop yang beku sejak page load dan tidak pernah berubah client-side
15. **Tweaks:** `TweaksProvider` dipasang di root layout (`src/app/layout.tsx`), bukan di (app)/layout. Ini berarti tweaks aktif di semua halaman termasuk admin dan landing page
16. **Middleware `isUserRoute`:** list ini harus diupdate setiap kali route baru ditambahkan ke `(app)` group. Saat ini mencakup: `/dashboard`, `/prds`, `/templates`, `/workspace`, `/ai-runs`, `/invite`. `/tickets` belum ada di list ini (tidak perlu karena user routes fallthrough ke protected check)
17. **`tickets` di admin sidebar:** badge count hanya menghitung status `open` (bukan `in_progress`) — konsisten dengan urgency-first view untuk admin
18. **Admin badge count tickets:** dihandle di `AdminShell` via Zustand local state + Realtime subscription `event: '*'` ke tabel `tickets` tanpa filter user_id — unique channel via `useRef` + `crypto.randomUUID()`
19. **Notifikasi ticket_submitted:** dikirim via `createAdminClient()` di `submitTicket` server action — failure tidak block submit ticket (wrapped dalam try/catch terpisah)
20. **Nama admin di notifikasi ticket:** `updateTicketStatus` fetch `full_name` dari `profiles` menggunakan `user.id` dari `requireSuperAdmin()` — di-include di body notifikasi "in progress" dan "resolved"
21. **Admin profile edit:** `AdminShell` punya `ProfileModal` — trigger dengan klik area foto/nama di popup sidebar. Local state `liveUserName` dan `liveAvatarUrl` sync dari `useUserStore` setelah save, tanpa `router.refresh()`
22. **Role "System Administrator":** user dengan `is_super_admin = true` selalu tampil "System Administrator" di kolom Role tabel admin users — di-override di `createUser` server action dan di render tabel
23. **Pipeline Board Realtime:** `pipeline-realtime-poller.tsx` — client component minimal yang subscribe ke tabel `prds` filtered `workspace_id`, event `'*'`, handler `router.refresh()`. Di-mount di `pipeline/page.tsx` sebagai sibling `PRDPipelineBoard`.
24. **PRD Editor status header:** `localStatus` state di `EditorShell` + Realtime subscription UPDATE pada tabel `prds` filtered by `id=eq.${prd.id}`. Tidak pakai `router.refresh()` di EditorShell — akan merusak cursor Tiptap. `editor-header.tsx` punya `useEffect([prd.status])` yang sync `setCurrentStatus` saat prop berubah dari parent.
25. **Poller components pattern:** semua poller adalah client component minimal (`'use client'`, `return null`) dengan `setInterval` + `document.visibilityState` check + `router.refresh()`. Naming convention: `[feature]-poller.tsx`. List poller yang ada: `pipeline-realtime-poller.tsx`, `dashboard-poller.tsx`, `ai-runs-poller.tsx`, `admin-overview-poller.tsx`, `admin-prds-poller.tsx`, `admin-ai-runs-poller.tsx`, `templates-poller.tsx`, `admin-templates-poller.tsx`, `share-poller.tsx`, `workspace-members-poller.tsx`.
26. **AppShell Realtime subscriptions:** sekarang ada 3 subscription di AppShell — tickets badge, workspace updates, dan PRD changes (dengan pathname guard untuk skip refresh saat di editor).
27. **Version History** — sengaja di-skip dari auto-update. SSR fresh saat route dibuka — acceptable karena user buka dengan intent spesifik. Bukan halaman pasif.
28. **yjs_documents RLS:** policy lama `USING (true)` diganti di migration 0036. Kolom `prd_id` ditambahkan (nullable, FK → prds CASCADE DELETE). Policy baru: READ untuk semua workspace member, WRITE hanya admin dan editor via `has_workspace_role()`. Dokumen lama tanpa `prd_id` menjadi inaccessible (orphaned).
29. **Rate limiting AI routes:** `checkRateLimit` sudah ditambahkan ke semua AI routes: `/api/prd/generate` (5 req/min), `/api/prd/ai-suggest` (20 req/min), `/api/prd/ai-review` (10 req/min), `/api/prd/refine` (10 req/min). Key pattern: `${action}:${user.id}`
30. **Admin workspaces count:** tidak lagi pakai full-table scan. Gunakan `Promise.all` of per-workspace `.select('*', { count: 'exact', head: true })` — hanya transfer integer count, bukan semua rows.
31. **getCurrentWorkspace parallel:** path cookie-based sekarang pakai `Promise.all` untuk query `workspace_members` dan `workspaces` secara paralel. Path fallback tetap sequential (benar — karena `firstMember.workspace_id` baru diketahui setelah query pertama).
32. **AI input validation:** semua AI routes punya length validation setelah parse body: `instruction` ≤ 5000 chars, `selectedText` ≤ 10000 chars, `customInstruction` ≤ 5000 chars. Return 400 kalau exceeded.
33. **fetchComments limit:** `.limit(200)` ditambahkan sebagai safety guard di `comments-actions.ts`.
34. **Provider URL:** `SUMOPOD_BASE_URL` dan `GANROUTER_BASE_URL` sekarang sebagai konstanta module-level di `providers.ts`. DB `base_url` tetap primary source, konstanta hanya fallback.
35. **Workspace members optimistic update:** `changeRole()` dan `removeMember()` sekarang punya optimistic update + rollback on error — sama dengan pattern admin ban/unban di `admin-users-table.tsx`.
36. **Admin users profiles subscription:** Realtime subscription ke tabel profiles dihapus (terlalu noisy). Diganti dengan polling 30s + visibility check — konsisten dengan pattern poller yang sudah ada.
37. **force_password_change flow:**
    - Admin reset password → `DraftMind2026!` + flag `true` di DB
    - Middleware cek `force_password_change` dari profiles setiap request — kalau true dan bukan di `/change-password` → redirect ke `/change-password`
    - `/change-password` ada di root `src/app/change-password/` (bukan dalam `(app)/`) — tidak dapat AppShell/sidebar
    - Server action: `forceChangePassword()` di `profile.ts` — tidak butuh old password, langsung update + clear flag + redirect('/dashboard')
    - Guard dua arah di middleware: force=true → redirect ke /change-password; force=false + di /change-password → redirect ke /dashboard
38. **last_active_at update:** di-update di `(app)/layout.tsx` setiap page load via `workspace_members` UPDATE. Dua kondisi:
    - Cookie `current_workspace_id` ada → update langsung
    - Cookie tidak ada → `getCurrentWorkspace()` punya DB fallback sendiri (ambil membership pertama) → currentWorkspaceId tetap truthy → if branch jalan
    - RLS fix di migration 0037: non-admin user (editor, viewer, commenter) sekarang bisa update `last_active_at` di row mereka sendiri
39. **Admin "Recently Active":** query pakai window 7 hari dari `workspace_members.last_active_at`. User muncul kalau last_active_at dalam 7 hari terakhir. Top 5 per workspace, deduplicate per user.
40. **Password default reset:** `DraftMind2026!` hardcoded di `src/app/(admin)/admin/actions.ts` sebagai `DEFAULT_PASSWORD`. Server-only — tidak ter-expose ke client (verified via strings command + DevTools + curl).

---

## 11. Bug Fixes Log

### 2026-05-16 — editor-shell.tsx

**BUG 1 — Race condition di auto-save (FIXED)**

- File: `src/components/editor/editor-shell.tsx`
- Root cause: tidak ada lock — dua `savePRDContent()` bisa berjalan bersamaan,
  save yang lebih lama bisa overwrite konten yang lebih baru.
- Fix: `isSavingRef` sebagai lock + `pendingContentRef` sebagai queue.
  Saat save sedang in-flight, content baru masuk ke queue. Setelah save
  selesai (`.finally()`), pending di-flush otomatis — hanya satu save
  berjalan pada satu waktu, konten terbaru selalu tersimpan.

**BUG 2 — Timestamp "Saved X ago" beku saat user idle (FIXED)**

- File: `src/components/editor/editor-shell.tsx`
- Root cause: `useMemo` hanya recalculate saat `localUpdatedAt` berubah,
  tidak update seiring waktu jika user idle.
- Fix: ganti ke `useState` + `useEffect` dengan `setInterval` 60 detik.
  Timestamp refresh otomatis setiap menit. Reset interval setiap kali
  `localUpdatedAt` berubah (save baru).

**BUG 3 — Avatar tidak auto-update di EditorHeader setelah ganti foto profil (FIXED)**

- File: `src/components/editor/editor-shell.tsx`
- Root cause: `localLastEditor.avatar` pakai `userAvatar` dari SSR prop yang beku sejak
  page load. Zustand store (`useUserStore.avatarUrl`) sudah update setelah upload avatar,
  tapi `EditorShell` tidak subscribe ke sana — sehingga avatar lama terus tampil di header
  PRD sampai page di-reload.
- Fix: subscribe ke `useUserStore` di `EditorShell`. Initial state dan `setLocalLastEditor`
  di `handleUpdate`/`handleInsert` pakai `storeAvatarUrl ?? userAvatar ?? null`.
  Tambah `useEffect` yang watch `storeAvatarUrl` — setiap kali user ganti foto,
  `localLastEditor.avatar` langsung sync tanpa perlu reload.

**IMPROVEMENT 1 — Notifikasi status PRD diperluas (DONE)**

- File: `src/app/(app)/prds/[prdId]/actions.ts`
- Sebelum: hanya owner PRD yang dapat notifikasi `review_request` kalau
  status diubah orang lain. Draft tidak ada notif sama sekali.
- Sesudah: setiap status berubah (kecuali ke `draft`), semua member
  workspace dapat notifikasi `status_changed` — kecuali user yang mengubah
  itu sendiri. Body notifikasi dinamis sesuai status baru.
- Notifikasi lama `review_request` dihapus untuk menghindari double notif.
- Yang bisa ubah status tetap sama: owner PRD atau workspace admin.

**BUG 4 — Active Today & Recently Active selalu kosong di Admin Dashboard (FIXED)**

- File: `src/app/(admin)/admin/page.tsx`
- Root cause: query ke `profiles.last_active_at` yang tidak ada di DB.
  Activity user sebenarnya di-track di `workspace_members.last_active_at`
  (diupdate setiap user buka halaman di layout.tsx), tapi admin dashboard
  mencarinya di tabel yang salah.
- Fix: ganti query ke `workspace_members.last_active_at`. Active Today
  count distinct user_id yang aktif sejak awal hari. Recently Active
  ambil 5 user_id unik dengan last_active_at terbaru, join ke profiles
  untuk nama/email/avatar.

**BUG 5 — Recently Active selalu kosong di Admin Dashboard (FIXED)**

- File: `src/app/(admin)/admin/page.tsx`
- Root cause: query `allProfilesPromise` select kolom `last_active_at` dari
  tabel `profiles` yang tidak ada di DB — menyebabkan query error,
  `profileMap` kosong, join ke workspace_members gagal, Recently Active
  selalu "No users yet".
- Fix: hapus `last_active_at` dari select profiles. Timestamp aktivitas
  sudah diambil dari `workspace_members.last_active_at` — tidak perlu
  dari profiles.

**IMPROVEMENT 2 — Ticket System (DONE)**

- Fitur baru: user bisa submit ticket ke admin system
- Tabel baru: `tickets` (migration 0027) + Realtime (0028)
- Sisi user: `/tickets` dengan list, modal submit, Supabase Realtime auto-update status
- Sisi admin: `/admin/tickets` dengan list + detail panel, update status, auto-notif ke user
- Notifikasi: type `ticket_update` masuk tab Announcements di bell icon
- Badge count di sidebar user: open + in_progress tickets
- Badge count di sidebar admin: open tickets only
- Bahasa: semua UI English

**IMPROVEMENT 3 — Em dash diganti regular dash (DONE)**

- 16 file UI diupdate — semua `—` diganti `-`

**BUG 6 — Foto workspace tidak tampil di admin panel (FIXED)**

- File: `src/app/(admin)/admin/workspaces/workspaces-client.tsx` + `page.tsx`
- Root cause: `icon_custom_url` tidak di-fetch dan tidak di-render di card
- Fix: tambah kolom ke query + render dengan fallback ke icon Building2

**BUG 7 — Foto workspace tidak tampil di ticket detail panel (FIXED)**

- File: `src/app/(admin)/admin/tickets/actions.ts` + `tickets-client.tsx`
- Root cause: join workspace tidak include `icon_custom_url`
- Fix: tambah kolom ke join query + render di chip workspace

**IMPROVEMENT 4 — Real-time data di seluruh app (DONE)**
Semua halaman yang sebelumnya stale (harus reload) sekarang auto-update:

High Priority (Supabase Realtime):

- /admin/tickets — admin langsung tahu ticket baru via Realtime subscription `event: '*'` (unique channel via `useRef` + `crypto.randomUUID()` untuk hindari React Strict Mode race condition) + polling 5s fallback
- /prds — list PRD user update via workspace_id-filtered subscription
- EditorShell comments — sudah real-time, ditambah REPLICA IDENTITY FULL (migration 0030)
- /admin/users — avatar/profile update via profiles UPDATE subscription (migration 0031)
- /admin/workspaces — workspace + member count update via dual subscription (migration 0032)

Medium Priority (Polling):

- /workspace/activity — polling 30s dengan visibility check
- /admin/analytics — polling 60s via AnalyticsPoller component
- /admin/activity-log — polling 30s dengan visibility check (interval dari 10s ke 30s)
- WorkspaceHub member tab — Supabase Realtime workspace_members subscription
- WorkspaceHub activity tab — polling 30s saat tab aktif

Migrations baru:

- 0029_prds_realtime_full.sql — REPLICA IDENTITY FULL untuk tabel prds
- 0030_comments_realtime_full.sql — REPLICA IDENTITY FULL untuk tabel comments
- 0031_profiles_realtime.sql — register profiles ke publication + REPLICA IDENTITY FULL
- 0032_workspaces_realtime.sql — register workspaces + REPLICA IDENTITY FULL untuk workspace_members

Semua cleanup memory leak (removeChannel, clearInterval) sudah diimplementasikan.

**BUG 8 — Admin ticket Realtime tidak berfungsi karena RLS (FIXED)**

- File: supabase/migrations/0034_tickets_rls_use_function.sql
- Root cause: Migration 0033 pakai raw subquery di USING clause yang hit
  tabel profiles (juga punya RLS). Dalam konteks Realtime evaluation,
  akses ke profiles terblokir sehingga semua INSERT events tidak
  diteruskan ke admin subscriber.
- Fix: Drop policy lama, recreate dengan USING (public.is_super_admin())
  — fungsi SECURITY DEFINER yang bypass RLS profiles.
- Tambahan: Polling fallback 15 detik di admin tickets sebagai safety net
  kalau Realtime masih ada gap.

**BUG 9 — Admin ticket Realtime masih tidak update tanpa reload (FIXED)**

- File: `src/app/(admin)/admin/tickets/tickets-client.tsx`
- Root cause 1 — Static channel name + React Strict Mode race condition:
  Channel name `'admin-tickets-realtime'` yang fixed menyebabkan konflik
  karena React Strict Mode double-invoke effects. `removeChannel()` bersifat
  async — saat cleanup belum selesai, mount kedua sudah subscribe ke nama
  channel yang sama. Ketika removal selesai, channel yang sedang aktif
  ikut terhapus → tidak ada subscription aktif sama sekali.
- Root cause 2 — Event filter terlalu sempit + polling terlalu lambat:
  `event: 'INSERT'` tidak menangkap UPDATE/DELETE. Polling 15 detik terlalu
  lama; admin bisa menganggap tidak berfungsi sebelum poll pertama terjadi.
- Fix:
  - Gunakan `useRef` dengan `crypto.randomUUID()` sebagai channel name —
    UUID di-generate sekali saat component mount pertama, ref persist across
    double-invoke sehingga kedua invocation efek pakai UUID yang sama.
  - Ganti `event: 'INSERT'` ke `event: '*'` agar semua perubahan tertangkap.
  - Kurangi interval polling dari 15 detik ke 5 detik.
  - Tambah error logging (dev-only) untuk mempermudah debug ke depannya.
- Side fix: `src/app/(app)/tickets/tickets-client.tsx` — fix 3 lint error
  `react/no-unescaped-entities` (pre-existing, tidak terkait bug ini).

**BUG 10 — Admin sidebar badge count tickets tidak real-time (FIXED)**

- File: `src/components/admin/admin-shell.tsx` + `src/app/(admin)/admin/tickets/actions.ts`
- Root cause: Badge count di-fetch sekali saat SSR di `(admin)/layout.tsx`
  dan membeku selamanya — tidak ada Realtime subscription atau Zustand store
  di AdminShell untuk update otomatis.
- Fix: Tambah `useState(openTicketCount)` sebagai `liveTicketCount`,
  tambah `useRef(crypto.randomUUID())` sebagai channel name unik,
  tambah `useEffect` dengan Supabase Realtime subscription `event: '*'`
  ke tabel `tickets` tanpa filter user_id — setiap perubahan ticket
  trigger `getAdminOpenTicketCount()` → `setLiveTicketCount(count)`.
  Tambah `getAdminOpenTicketCount()` server action di tickets/actions.ts.

**IMPROVEMENT 5 — Admin profile edit (nama + foto + password) (DONE)**

- File: `src/components/admin/admin-shell.tsx` + `src/app/(admin)/admin/layout.tsx`
- Tambah `avatar_url` ke query di layout, pass sebagai prop `userAvatarUrl`
- AdminShell: tambah `ProfileModal`, local state `liveUserName` +
  `liveAvatarUrl` + `profileOpen`, Avatar component, chevron rotate
- Popup sidebar direstrukturisasi: area foto/nama clickable → trigger
  ProfileModal, session info, logout
- Post-save sync via `useUserStore` watch — sidebar update tanpa reload

**IMPROVEMENT 6 — Nama admin di notifikasi ticket (DONE)**

- File: `src/app/(admin)/admin/tickets/actions.ts`
- `updateTicketStatus` sekarang fetch `full_name` dari `profiles`
  menggunakan `user.id` dari `requireSuperAdmin()`
- Body notifikasi diperbarui:
  - In Progress: "...is being handled by ${adminName}."
  - Resolved: "...has been resolved by ${adminName}."

**IMPROVEMENT 7 — Notifikasi "Ticket received" saat user submit (DONE)**

- Migration: `0035_notification_ticket_submitted.sql`
  — ALTER TYPE notification_type ADD VALUE 'ticket_submitted'
- File: `src/app/(app)/tickets/actions.ts`
- `submitTicket` sekarang:
  - Insert tickets dengan `.select('id').single()` untuk tangkap ticket id
  - Import `createAdminClient` untuk bypass RLS saat insert notifikasi
  - Insert notifikasi type `ticket_submitted` ke user setelah submit sukses
  - Failure notifikasi tidak block submit — wrapped try/catch terpisah
- User menerima notifikasi di bell icon tab Announcements:
  "Your ticket '[subject]' has been received."

**IMPROVEMENT 8 — Role "System Administrator" untuk admin system (DONE)**

- File: `src/components/admin/admin-users-table.tsx` +
  `src/app/(admin)/admin/actions.ts`
- CreateUserModal: field Role hilang sepenuhnya saat checkbox
  "Set as admin system" dicentang (`{!isAdmin && (...)}`)
- `createUser` server action: `role_self_reported` di-override ke
  'System Administrator' jika `is_super_admin: true`
- Kolom Role di tabel users: tampil "System Administrator" untuk
  admin system, bukan `role_self_reported` dari DB

**BUG 11 — ReferenceError: useRouter tidak ditemukan di browser (FIXED)**

- Root cause: Bukan masalah source code — file sudah bersih tanpa `useRouter`
  sama sekali. Error berasal dari stale `.next` build cache yang masih
  menyimpan bundle lama (sebelum sesi sebelumnya menghapus `useRouter`).
- Fix: Hapus `.next/` sehingga Next.js recompile dari source yang benar
  saat dev server dijalankan berikutnya. Tidak ada perubahan source code.

**STATUS TICKET SYSTEM — Semua fitur selesai:**
Sisi user:

- Submit ticket (kategori, subject, detail)
- List ticket dengan status real-time
- Badge count auto-update dari mana pun (AppShell)
- Notifikasi bell icon saat status berubah

Sisi admin:

- List semua ticket real-time (Realtime `event: '*'` + polling 5s fallback)
- Detail panel: info user, workspace, kategori, pesan
- Update status: Open → In Progress → Resolved
- Auto-notif ke user via Announcements saat status berubah
- Badge count di sidebar

Yang masih perlu ditest:

- Area 20 — Multi-user (presence, cursor, real-time edit)
- Area 21 — Sidebar collapsed

**IMPROVEMENT 9 — Auto-update menyeluruh seluruh app (DONE)**

Total 17 item di-fix, 1 skip (Version History).

🔴 Critical (2):

- Pipeline Board: tambah `pipeline-realtime-poller.tsx` — Realtime subscription prds → router.refresh()
- PRD Editor status header: `localStatus` state + Realtime UPDATE subscription di EditorShell. `editor-header.tsx` tambah `useEffect` sync saat prop berubah.

🟡 Medium (9):

- Admin Overview: `AdminOverviewPoller` polling 60s
- Admin Users ban/unban: optimistic update + rollback on error
- Admin Users create/toggle admin: `router.refresh()` di client setelah action sukses
- Admin PRDs: `AdminPRDsPoller` polling 30s
- Workspace name → member lain + sidebar: Realtime subscription `workspaces` UPDATE di AppShell → `router.refresh()`
- Dashboard activity feed: `DashboardPoller` polling 30s
- AI Runs user: `AIRunsPoller` polling 30s
- Admin AI Runs: `AdminAIRunsPoller` polling 60s (cover stats juga)

🟢 Low (5, 1 tidak perlu perubahan):

- Templates user: `TemplatesPoller` polling 60s
- Admin Templates: `AdminTemplatesPoller` polling 60s
- Recent PRDs sidebar: Realtime `prds` di AppShell dengan pathname guard (skip saat di editor)
- Share link: `SharePoller` polling 60s
- Workspace Members online dot: `WorkspaceMembersPoller` polling 30s
- Comment card avatar: tidak perlu perubahan — `fetchComments` sudah join `profiles(avatar_url)`, Realtime handler sudah call `loadComments()`

⏭️ Skip (1):

- Version History — acceptable, SSR fresh saat route dibuka

**COMPREHENSIVE FINAL AUDIT — Pre-deployment (DONE)**

Total temuan: 1 Critical, 2 Medium, 7 Low, 4 INFO (skip).
Semua 10 item di-fix dalam 3 batch.

🔴 Critical (1):

- yjs_documents RLS USING (true) → fix di migration 0036: tambah kolom prd_id + workspace-aware policy

🟡 Medium (2):

- Rate limit missing di ai-review & refine → tambah checkRateLimit di kedua route
- Admin workspaces full-table scan → ganti dengan Promise.all per-workspace count query

🟢 Low (7):

- getCurrentWorkspace sequential → Promise.all parallel
- Invite dead 'owner' role check → ganti ke 'admin' only
- AI input length validation → tambah di ai-suggest & refine
- fetchComments tanpa limit → tambah .limit(200)
- Provider URL hardcode → ekstrak sebagai konstanta fallback
- Workspace members tanpa optimistic update → tambah optimistic update + rollback
- Admin profiles subscription noisy → ganti ke polling 30s

ℹ️ INFO — Skip (4):

- prd_shares no DELETE policy — intentional (soft-delete)
- system_logs no user policy — intentional (service role only)
- crypto.randomUUID() di useRef — negligible overhead
- 1 TODO comment — intentional roadmap note (post-FYP)

Deployment readiness: 🟡 CONDITIONAL → setelah semua fix: ✅ READY TO DEPLOY

**BUG 11 — force_password_change tidak berfungsi (FIXED)**

- Root cause: query param `?force_password_change=true` dikirim ke /dashboard dari login tapi tidak ada yang membacanya — tidak ada modal, redirect, atau guard yang ter-trigger. User bisa bypass dan masuk dashboard normal tanpa ganti password.
- Fix:
  - Middleware extend select → tambah `force_password_change`
  - Guard di middleware: force=true + bukan di /change-password → redirect ke /change-password
  - Guard reverse: force=false + di /change-password → redirect ke /dashboard
  - Buat `src/app/change-password/page.tsx` — halaman baru di root (bukan dalam (app)/) tanpa AppShell
  - Tambah `forceChangePassword()` server action di profile.ts

**BUG 12 — TypeError: result.error di admin reset password (FIXED)**

- File: `src/components/admin/admin-users-table.tsx` line 81
- Root cause: `result.error` diakses tanpa optional chaining saat result bisa undefined
- Fix: ganti `result.error` → `result?.error`

**BUG 13 — last_active_at tidak ter-update untuk non-admin user (FIXED)**

- Root cause: RLS policy di migration 0002 hanya allow UPDATE workspace_members untuk workspace admin. Non-admin (editor, viewer, commenter) tidak bisa update row mereka sendiri — update silently 0 rows affected tanpa error.
- Fix: migration 0037 — tambah policy baru "Members can update own last_active_at" dengan USING (auth.uid() = user_id). Dua policy UPDATE sekarang co-exist:
  (1) admin update semua member di workspace mereka
  (2) setiap user update row mereka sendiri
- Side investigation: else branch yang ditambahkan di fix pertama tidak pernah ter-eksekusi karena getCurrentWorkspace() punya DB fallback sendiri — currentWorkspaceId selalu truthy untuk user yang punya workspace membership.

**INVESTIGASI TOTAL — Verifikasi semua fitur (DONE)**
Investigasi langsung dari source code — 2026-05-18.
Total: ~75 ✅ Working, 9 ⚠️ Partial, 6 ❌ Bug, 1 ❓ Unverified.

Fitur yang ada di source tapi tidak di SESSION_HANDOVER:

- 6 format export (HTML, DOCX, Slack, Jira) — selain PDF + Markdown
- Transfer ownership workspace — owner-only, ada di workspace settings
- Admin Settings page — read-only system configuration overview
- Provider health monitoring — real-time stats per provider
- System Logs export to JSON
- Copilot "More Actions" — 7 action tambahan (translate, add_examples, dll)

**BUG 14 — last_active_at RLS block untuk non-admin (FIXED)**

- File: supabase/migrations/0037_workspace_members_self_update.sql
- Root cause: RLS policy lama hanya allow UPDATE workspace_members
  untuk workspace admin. Non-admin (editor, viewer, commenter)
  tidak bisa update last_active_at mereka sendiri — silent 0 rows.
- Fix: migration 0037 tambah policy baru "Members can update own
  last_active_at" dengan USING (auth.uid() = user_id).
  Dua policy UPDATE sekarang co-exist.
- Side finding: else branch di layout.tsx tidak pernah jalan
  karena getCurrentWorkspace() punya DB fallback sendiri —
  currentWorkspaceId selalu truthy untuk user yang punya membership.

**IMPROVEMENT 10 — Label "Active PRDs" → "Total PRDs" (DONE)**

- File: src/components/dashboard/home-feed.tsx line 128
- Label stat card diganti dari "Active PRDs" ke "Total PRDs"
  karena query menghitung semua PRD tanpa filter status.

**IMPROVEMENT 11 — Password strength validation (DONE)**

- File: src/app/change-password/page.tsx +
  src/components/settings/profile-modal.tsx
- Requirement baru: minimal 8 karakter + 1 huruf besar + 1 angka
- Regex: /^(?=._[A-Z])(?=._\d).{8,}$/
- Error message: "Password must be at least 8 characters,
  include one uppercase letter and one number."
- Berlaku di force change password page dan profile modal

**IMPROVEMENT 12 — Admin user count dari DB (DONE)**

- File: src/components/admin/admin-users-table.tsx +
  src/app/(admin)/admin/users/page.tsx
- Tambah prop totalCount: number ke AdminUsersTable
- page.tsx pass totalCount={count ?? 0} dari query yang sudah ada
- "X registered users" sekarang akurat dari DB, bukan localUsers.length

**SOON (post-FYP) — Fitur yang ditunda:**

- AI Copilot streaming — refactor generateText() ke streamText()
- Pipeline drag & drop — implement @dnd-kit atau sejenisnya
- Notifikasi delete PRD — kirim notif ke semua workspace member
  saat PRD dihapus

**SKIP (acceptable untuk FYP):**

- Rename PRD — title static by design, user tidak perlu rename
- Continue Working filter — by design, tampilkan semua PRD workspace
- Announcements admin — admin tidak perlu terima announcement sendiri
- Template "Create PRD" button — flow dari /prds/new sudah cukup
- Share link revoke — tidak perlu revoke by design
- Comments soft delete — over-engineering untuk FYP
- Outline panel hidden sections persist — minor UX
- Copilot chat history — nice to have
- Register flow — invite-only by design
- Delete PRD permission feedback — Soon

**BUG 15 — App crash saat member di-remove dari workspace (FIXED)**

- Root cause: Saat removeMember() berhasil, Realtime trigger
  router.refresh() di semua client termasuk user yang di-remove.
  User yang di-remove → getCurrentWorkspace() return null →
  page component crash karena tidak handle workspaceId = undefined.
  Admin juga crash karena race condition saat refresh.
- Fix (3 layer):
  1. workspace-members-tab.tsx — setelah removeMember() sukses,
     jika userId === currentUserId → router.push('/dashboard')
  2. middleware.ts + layout.tsx — forward x-pathname sebagai header,
     layout redirect('/dashboard') jika workspaces.length === 0
     dan pathname startsWith('/workspace')
  3. workspace/members/page.tsx — sudah ada safety net:
     if (!workspace) redirect('/dashboard')

**BUG 16 — Pending invitation tidak auto-update setelah di-accept (FIXED)**

- File: src/components/workspace/workspace-members-tab.tsx line 74
- Root cause: Subscription workspace_invitations pakai filter
  workspace_id=eq.{workspaceId}. Saat UPDATE accepted_at, WAL
  payload tidak include workspace_id (tidak berubah) → Supabase
  Realtime tidak bisa evaluate filter → event tidak di-deliver
  ke admin subscriber → list tidak update tanpa reload.
- Fix: Hapus filter dari subscription workspace_invitations —
  listen ke semua event pada tabel tanpa filter. Bandwidth
  overhead minimal karena tabel ini jarang berubah.
